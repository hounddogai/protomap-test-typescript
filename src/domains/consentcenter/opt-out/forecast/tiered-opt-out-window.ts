import * as text from "../../../../kit/text.js";

/** Where a tiered opt out window is in its life cycle. */
export type TieredOptOutWindowStatus = "requested" | "granted" | "revoked" | "expired";

/** One tiered opt out window, with what the planners need to act on it. */
export class TieredOptOutWindow {
  code: string;
  name: string;
  ratio: number;
  visible: boolean;
  channel: string;
  status: TieredOptOutWindowStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    visible: boolean,
    channel: string,
    status: TieredOptOutWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.visible = visible;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredOptOutWindowStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TieredOptOutWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered opt out window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): TieredOptOutWindow {
    return new TieredOptOutWindow(this.code, this.name, this.ratio, this.visible, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a tiered opt out window in status requested. */
export function newTieredOptOutWindow(code: string, name: string): TieredOptOutWindow {
  return new TieredOptOutWindow(code, name, 0, false, "", "requested");
}
