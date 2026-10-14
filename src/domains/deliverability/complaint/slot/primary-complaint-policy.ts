import * as text from "../../../../kit/text.js";

/** Where a primary complaint policy is in its life cycle. */
export type PrimaryComplaintPolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** A primary complaint policy. Its code is unique within a tenant. */
export class PrimaryComplaintPolicy {
  code: string;
  title: string;
  summary: string;
  discount: number;
  version: number;
  ratio: number;
  margin: number;
  segment: string;
  updatedAt: number;
  visible: boolean;
  status: PrimaryComplaintPolicyStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    discount: number,
    version: number,
    ratio: number,
    margin: number,
    segment: string,
    updatedAt: number,
    visible: boolean,
    status: PrimaryComplaintPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.discount = discount;
    this.version = version;
    this.ratio = ratio;
    this.margin = margin;
    this.segment = segment;
    this.updatedAt = updatedAt;
    this.visible = visible;
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

  canMoveTo(next: PrimaryComplaintPolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PrimaryComplaintPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary complaint policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedLoad(): number {
    return Math.round(this.updatedAt * this.discount * 100) / 100;
  }

  copy(): PrimaryComplaintPolicy {
    return new PrimaryComplaintPolicy(
      this.code,
      this.title,
      this.summary,
      this.discount,
      this.version,
      this.ratio,
      this.margin,
      this.segment,
      this.updatedAt,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a primary complaint policy in status requested. */
export function newPrimaryComplaintPolicy(code: string, title: string): PrimaryComplaintPolicy {
  return new PrimaryComplaintPolicy(code, title, "", 0, 0, 0, 0, "", 0, false, "requested");
}
