import * as text from "../../../../kit/text.js";

/** Where a global domain threshold is in its life cycle. */
export type GlobalDomainThresholdStatus = "requested" | "granted" | "revoked" | "expired";

/** One global domain threshold, with what the planners need to act on it. */
export class GlobalDomainThreshold {
  code: string;
  name: string;
  phone: string;
  journeyId: string;
  variant: string;
  score: number;
  status: GlobalDomainThresholdStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    journeyId: string,
    variant: string,
    score: number,
    status: GlobalDomainThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.journeyId = journeyId;
    this.variant = variant;
    this.score = score;
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

  canMoveTo(next: GlobalDomainThresholdStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalDomainThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global domain threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"global domain threshold"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): GlobalDomainThreshold {
    return new GlobalDomainThreshold(
      this.code,
      this.name,
      this.phone,
      this.journeyId,
      this.variant,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global domain threshold in status requested. */
export function newGlobalDomainThreshold(code: string, name: string): GlobalDomainThreshold {
  return new GlobalDomainThreshold(code, name, "", "", "", 0, "requested");
}
