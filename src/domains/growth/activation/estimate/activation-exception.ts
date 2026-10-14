import * as text from "../../../../kit/text.js";

/** Where a activation exception is in its life cycle. */
export type ActivationExceptionStatus = "requested" | "granted" | "revoked" | "expired";

/** One activation exception, with what the planners need to act on it. */
export class ActivationException {
  code: string;
  name: string;
  discount: number;
  bid: number;
  impressions: number;
  revision: number;
  region: string;
  ratio: number;
  category: string;
  endsAt: number;
  status: ActivationExceptionStatus;

  constructor(
    code: string,
    name: string,
    discount: number,
    bid: number,
    impressions: number,
    revision: number,
    region: string,
    ratio: number,
    category: string,
    endsAt: number,
    status: ActivationExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.discount = discount;
    this.bid = bid;
    this.impressions = impressions;
    this.revision = revision;
    this.region = region;
    this.ratio = ratio;
    this.category = category;
    this.endsAt = endsAt;
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

  canMoveTo(next: ActivationExceptionStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ActivationExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedValue(): number {
    return Math.round(this.impressions * this.revision * 100) / 100;
  }

  copy(): ActivationException {
    return new ActivationException(
      this.code,
      this.name,
      this.discount,
      this.bid,
      this.impressions,
      this.revision,
      this.region,
      this.ratio,
      this.category,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a activation exception in status requested. */
export function newActivationException(code: string, name: string): ActivationException {
  return new ActivationException(code, name, 0, 0, 0, 0, "", 0, "", 0, "requested");
}
