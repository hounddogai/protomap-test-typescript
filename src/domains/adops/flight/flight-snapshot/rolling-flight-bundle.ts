import * as text from "../../../../kit/text.js";

/** Where a rolling flight bundle is in its life cycle. */
export type RollingFlightBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a rolling flight bundle and its current status. */
export class RollingFlightBundle {
  code: string;
  name: string;
  sendAt: number;
  locale: string;
  visible: boolean;
  checksum: string;
  source: string;
  ceiling: number;
  retries: number;
  quantity: number;
  status: RollingFlightBundleStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    locale: string,
    visible: boolean,
    checksum: string,
    source: string,
    ceiling: number,
    retries: number,
    quantity: number,
    status: RollingFlightBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.locale = locale;
    this.visible = visible;
    this.checksum = checksum;
    this.source = source;
    this.ceiling = ceiling;
    this.retries = retries;
    this.quantity = quantity;
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

  canMoveTo(next: RollingFlightBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: RollingFlightBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling flight bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"rolling flight bundle"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.sendAt - this.quantity) * 100) / 100;
  }

  copy(): RollingFlightBundle {
    return new RollingFlightBundle(
      this.code,
      this.name,
      this.sendAt,
      this.locale,
      this.visible,
      this.checksum,
      this.source,
      this.ceiling,
      this.retries,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a rolling flight bundle in status idle. */
export function newRollingFlightBundle(code: string, name: string): RollingFlightBundle {
  return new RollingFlightBundle(code, name, 0, "", false, "", "", 0, 0, 0, "idle");
}
