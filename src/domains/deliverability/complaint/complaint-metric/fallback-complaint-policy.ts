import * as text from "../../../../kit/text.js";

/** Where a fallback complaint policy is in its life cycle. */
export type FallbackComplaintPolicyStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A fallback complaint policy. Its code is unique within a tenant. */
export class FallbackComplaintPolicy {
  code: string;
  name: string;
  source: string;
  timezone: string;
  maximum: number;
  locale: string;
  minimum: number;
  channel: string;
  status: FallbackComplaintPolicyStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    timezone: string,
    maximum: number,
    locale: string,
    minimum: number,
    channel: string,
    status: FallbackComplaintPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.timezone = timezone;
    this.maximum = maximum;
    this.locale = locale;
    this.minimum = minimum;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackComplaintPolicyStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "active";
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackComplaintPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback complaint policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveLoad(): number {
    return Math.round((this.minimum - this.maximum) * 100) / 100;
  }

  copy(): FallbackComplaintPolicy {
    return new FallbackComplaintPolicy(
      this.code,
      this.name,
      this.source,
      this.timezone,
      this.maximum,
      this.locale,
      this.minimum,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a fallback complaint policy in status draft. */
export function newFallbackComplaintPolicy(code: string, name: string): FallbackComplaintPolicy {
  return new FallbackComplaintPolicy(code, name, "", "", 0, "", 0, "", "draft");
}
