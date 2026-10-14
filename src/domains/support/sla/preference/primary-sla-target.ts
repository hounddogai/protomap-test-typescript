import * as text from "../../../../kit/text.js";

/** Where a primary sla target is in its life cycle. */
export type PrimarySlaTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A primary sla target. Its code is unique within a tenant. */
export class PrimarySlaTarget {
  code: string;
  title: string;
  revision: number;
  audienceId: string;
  ratio: number;
  name: string;
  externalRef: string;
  frequencyCap: number;
  durationMinutes: number;
  attributes: Map<string, string>;
  status: PrimarySlaTargetStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    audienceId: string,
    ratio: number,
    name: string,
    externalRef: string,
    frequencyCap: number,
    durationMinutes: number,
    attributes: Map<string, string>,
    status: PrimarySlaTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.audienceId = audienceId;
    this.ratio = ratio;
    this.name = name;
    this.externalRef = externalRef;
    this.frequencyCap = frequencyCap;
    this.durationMinutes = durationMinutes;
    this.attributes = attributes;
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

  canMoveTo(next: PrimarySlaTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimarySlaTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary sla target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"primary sla target"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netExposure(): number {
    return Math.round((this.revision - this.durationMinutes) * 100) / 100;
  }

  copy(): PrimarySlaTarget {
    return new PrimarySlaTarget(
      this.code,
      this.title,
      this.revision,
      this.audienceId,
      this.ratio,
      this.name,
      this.externalRef,
      this.frequencyCap,
      this.durationMinutes,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary sla target in status proposed. */
export function newPrimarySlaTarget(code: string, title: string): PrimarySlaTarget {
  return new PrimarySlaTarget(code, title, 0, "", 0, "", "", 0, 0, new Map<string, string>(), "proposed");
}
