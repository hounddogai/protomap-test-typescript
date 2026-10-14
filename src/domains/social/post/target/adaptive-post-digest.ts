import * as text from "../../../../kit/text.js";

/** Where a adaptive post digest is in its life cycle. */
export type AdaptivePostDigestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A adaptive post digest. Its code is unique within a tenant. */
export class AdaptivePostDigest {
  code: string;
  name: string;
  cohort: string;
  maximum: number;
  timezone: string;
  variant: string;
  utmSource: string;
  status: AdaptivePostDigestStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    maximum: number,
    timezone: string,
    variant: string,
    utmSource: string,
    status: AdaptivePostDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.maximum = maximum;
    this.timezone = timezone;
    this.variant = variant;
    this.utmSource = utmSource;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptivePostDigestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: AdaptivePostDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive post digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive post digest"} ${this.code}`;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): AdaptivePostDigest {
    return new AdaptivePostDigest(
      this.code,
      this.name,
      this.cohort,
      this.maximum,
      this.timezone,
      this.variant,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a adaptive post digest in status new. */
export function newAdaptivePostDigest(code: string, name: string): AdaptivePostDigest {
  return new AdaptivePostDigest(code, name, "", 0, "", "", "", "new");
}
