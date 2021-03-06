/**
 * Copyright (c) 2019 Paul Lewis
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Toast } from '../components/toast.js';
import { person, PersonData } from '../model/model.js';
import { fade } from '../utils/fade.js';
import { move } from '../utils/move.js';
import * as Router from '../utils/router.js';
import { SectionElement } from '../utils/section.js';

interface RouteData {
  data: {
    id?: string
  };
}

class Details extends SectionElement {
  protected mainSource!: HTMLElement;
  private personData!: PersonData | undefined;
  private avatarCopy?: HTMLImageElement;

  async beforeShow(hostElement: HTMLElement, routeData: RouteData) {
    const { id } = routeData.data;
    if (!id) {
      return;
    }

    this.personData = await person.retrieve(id);
    const home = hostElement.querySelector('pm-home') as HTMLElement;
    if (!home) {
      return;
    }

    const element = home.shadowRoot!.querySelector(`[data-name="${id}"]`);
    if (!element) {
      return;
    }

    // Copy the image for the view transition.
    this.avatarCopy = element.cloneNode(true) as HTMLImageElement;
    const { left, top, width, height } = element.getBoundingClientRect();
    this.avatarCopy.style.position = 'fixed';
    this.avatarCopy.style.left = `${left}px`;
    this.avatarCopy.style.top = `${top}px`;
    this.avatarCopy.style.width = `${width}px`;
    this.avatarCopy.style.height = `${height}px`;

    document.body.appendChild(this.avatarCopy);
  }

  async show(hostElement: HTMLElement, routeData: RouteData) {
    const show = super.show(hostElement, routeData);

    if (!this.personData) {
      Toast.create('🔍 Unable to find person.');
      Router.home();
      return;
    }

    this.root.querySelector('h1')!.textContent = this.personData.name;

    const avatar = this.root.querySelector('img');
    if (!avatar) {
      return;
    }

    avatar.src = '/static/images/person.jpg';

    if (this.avatarCopy) {
      // 1. Calculate the difference between avatar and copy.
      const to = this.calculateDiff(avatar, this.avatarCopy);

      // 2. Hide the avatar.
      avatar.style.display = 'none';

      // 3. Animate the copy into place.
      await move({ el: this.avatarCopy, to });

      // 4. Hide the copy and restore the avatar.
      this.removeAvatarCopy();
      avatar.style.display = 'block';
    }

    return show;
  }

  async hide(hostElement: HTMLElement) {
    if (this.avatarCopy) {
      await fade({ el: this.avatarCopy, to: 0, duration: 200 });
      this.removeAvatarCopy();
    }

    return super.hide(hostElement);
  }

  private removeAvatarCopy() {
    if (!this.avatarCopy) {
      return;
    }

    this.avatarCopy.remove();
    this.avatarCopy = undefined;
  }

  private calculateDiff(src: HTMLElement, dest: HTMLElement) {
    const srcBounds = src.getBoundingClientRect();
    const destBounds = dest.getBoundingClientRect();

    return {
      h: srcBounds.height / destBounds.height,
      w: srcBounds.width / destBounds.width,
      x: srcBounds.left - destBounds.left,
      y: srcBounds.top - destBounds.top,
    };
  }
}

customElements.define('pm-details', Details);

export default new Details();
