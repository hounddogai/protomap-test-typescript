import * as text from "../../../../kit/text.js";

/** Where a window bundle is in its life cycle. */
export type WindowBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A window bundle. Its code is unique within a tenant. */
export class WindowBundle {
  code: string;
  name: string;
  openRate: number;
  ownerId: string;
  locale: string;
  status: WindowBundleStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    ownerId: string,
    locale: string,
    status: WindowBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.ownerId = ownerId;
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

  canMoveTo(next: WindowBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): WindowBundle {
    return new WindowBundle(this.code, this.name, this.openRate, this.ownerId, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a window bundle in status idle. */
export function newWindowBundle(code: string, name: string): WindowBundle {
  return new WindowBundle(code, name, 0, "", "", "idle");
}
