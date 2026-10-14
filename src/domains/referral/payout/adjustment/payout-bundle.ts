import * as text from "../../../../kit/text.js";

/** Where a payout bundle is in its life cycle. */
export type PayoutBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** One payout bundle, with what the planners need to act on it. */
export class PayoutBundle {
  code: string;
  label: string;
  tags: string[];
  ratio: number;
  audienceId: string;
  visible: boolean;
  channel: string;
  discount: number;
  ownerId: string;
  rate: number;
  status: PayoutBundleStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    ratio: number,
    audienceId: string,
    visible: boolean,
    channel: string,
    discount: number,
    ownerId: string,
    rate: number,
    status: PayoutBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.ratio = ratio;
    this.audienceId = audienceId;
    this.visible = visible;
    this.channel = channel;
    this.discount = discount;
    this.ownerId = ownerId;
    this.rate = rate;
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

  canMoveTo(next: PayoutBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PayoutBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"payout bundle"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedTotal(): number {
    return Math.round((this.rate - this.discount) * 100) / 100;
  }

  copy(): PayoutBundle {
    return new PayoutBundle(
      this.code,
      this.label,
      this.tags,
      this.ratio,
      this.audienceId,
      this.visible,
      this.channel,
      this.discount,
      this.ownerId,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a payout bundle in status requested. */
export function newPayoutBundle(code: string, label: string): PayoutBundle {
  return new PayoutBundle(code, label, [], 0, "", false, "", 0, "", 0, "requested");
}
