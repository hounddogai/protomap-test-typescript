import * as text from "../../../../kit/text.js";

/** Where a domain rollup is in its life cycle. */
export type DomainRollupStatus = "new" | "queued" | "running" | "done" | "failed";

/** A domain rollup. Its code is unique within a tenant. */
export class DomainRollup {
  code: string;
  label: string;
  channel: string;
  region: string;
  timezone: string;
  frequencyCap: number;
  campaignRef: string;
  externalRef: string;
  revision: number;
  status: DomainRollupStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    region: string,
    timezone: string,
    frequencyCap: number,
    campaignRef: string,
    externalRef: string,
    revision: number,
    status: DomainRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.region = region;
    this.timezone = timezone;
    this.frequencyCap = frequencyCap;
    this.campaignRef = campaignRef;
    this.externalRef = externalRef;
    this.revision = revision;
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

  canMoveTo(next: DomainRollupStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: DomainRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round((this.revision + this.frequencyCap) * 100) / 100;
  }

  copy(): DomainRollup {
    return new DomainRollup(
      this.code,
      this.label,
      this.channel,
      this.region,
      this.timezone,
      this.frequencyCap,
      this.campaignRef,
      this.externalRef,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a domain rollup in status new. */
export function newDomainRollup(code: string, label: string): DomainRollup {
  return new DomainRollup(code, label, "", "", "", 0, "", "", 0, "new");
}
