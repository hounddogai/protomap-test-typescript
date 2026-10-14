import * as text from "../../../../kit/text.js";

/** Where a lenient deflection bundle is in its life cycle. */
export type LenientDeflectionBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One lenient deflection bundle, with what the planners need to act on it. */
export class LenientDeflectionBundle {
  code: string;
  name: string;
  ratio: number;
  description: string;
  summary: string;
  audienceId: string;
  unit: string;
  campaignRef: string;
  version: number;
  updatedAt: number;
  notes: string;
  status: LenientDeflectionBundleStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    description: string,
    summary: string,
    audienceId: string,
    unit: string,
    campaignRef: string,
    version: number,
    updatedAt: number,
    notes: string,
    status: LenientDeflectionBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.description = description;
    this.summary = summary;
    this.audienceId = audienceId;
    this.unit = unit;
    this.campaignRef = campaignRef;
    this.version = version;
    this.updatedAt = updatedAt;
    this.notes = notes;
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

  canMoveTo(next: LenientDeflectionBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LenientDeflectionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient deflection bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round(this.ratio * this.version * 100) / 100;
  }

  copy(): LenientDeflectionBundle {
    return new LenientDeflectionBundle(
      this.code,
      this.name,
      this.ratio,
      this.description,
      this.summary,
      this.audienceId,
      this.unit,
      this.campaignRef,
      this.version,
      this.updatedAt,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a lenient deflection bundle in status draft. */
export function newLenientDeflectionBundle(code: string, name: string): LenientDeflectionBundle {
  return new LenientDeflectionBundle(code, name, 0, "", "", "", "", "", 0, 0, "", "draft");
}
