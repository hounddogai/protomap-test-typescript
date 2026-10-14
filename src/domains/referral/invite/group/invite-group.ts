/**
 * The invite group records of referral's invite work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a invite group is in its life cycle. */
export type InviteGroupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A invite group as the invite team keeps it. */
export class InviteGroup {
  code: string;
  name: string;
  updatedAt: number;
  visible: boolean;
  utmSource: string;
  locale: string;
  status: InviteGroupStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    visible: boolean,
    utmSource: string,
    locale: string,
    status: InviteGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.visible = visible;
    this.utmSource = utmSource;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: InviteGroupStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): InviteGroup {
    return new InviteGroup(
      this.code,
      this.name,
      this.updatedAt,
      this.visible,
      this.utmSource,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a invite group in status idle. */
export function newInviteGroup(code: string, name: string): InviteGroup {
  return new InviteGroup(code, name, 0, false, "", "", "idle");
}
