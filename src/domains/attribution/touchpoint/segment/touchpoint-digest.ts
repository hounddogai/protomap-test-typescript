import * as text from "../../../../kit/text.js";

/** Where a touchpoint digest is in its life cycle. */
export type TouchpointDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a touchpoint digest and its current status. */
export class TouchpointDigest {
  code: string;
  name: string;
  batchSize: number;
  currency: string;
  ratio: number;
  conversionRate: number;
  status: TouchpointDigestStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    currency: string,
    ratio: number,
    conversionRate: number,
    status: TouchpointDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.currency = currency;
    this.ratio = ratio;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: TouchpointDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netValue(): number {
    return Math.round(this.ratio * this.batchSize * 100) / 100;
  }

  copy(): TouchpointDigest {
    return new TouchpointDigest(
      this.code,
      this.name,
      this.batchSize,
      this.currency,
      this.ratio,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a touchpoint digest in status requested. */
export function newTouchpointDigest(code: string, name: string): TouchpointDigest {
  return new TouchpointDigest(code, name, 0, "", 0, 0, "requested");
}
