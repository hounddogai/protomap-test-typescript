import * as text from "../../../../kit/text.js";

/** Where a paywall manifest is in its life cycle. */
export type PaywallManifestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A paywall manifest as the paywall team keeps it. */
export class PaywallManifest {
  code: string;
  name: string;
  timezone: string;
  sendAt: number;
  audienceId: string;
  status: PaywallManifestStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    sendAt: number,
    audienceId: string,
    status: PaywallManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.sendAt = sendAt;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PaywallManifestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PaywallManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"paywall manifest"} ${this.code}`;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): PaywallManifest {
    return new PaywallManifest(this.code, this.name, this.timezone, this.sendAt, this.audienceId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a paywall manifest in status proposed. */
export function newPaywallManifest(code: string, name: string): PaywallManifest {
  return new PaywallManifest(code, name, "", 0, "", "proposed");
}
