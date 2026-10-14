import * as text from "../../../../kit/text.js";

/** Where a adaptive creative bundle is in its life cycle. */
export type AdaptiveCreativeBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a adaptive creative bundle and its current status. */
export class AdaptiveCreativeBundle {
  code: string;
  name: string;
  label: string;
  journeyId: string;
  source: string;
  frequencyCap: number;
  status: AdaptiveCreativeBundleStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    journeyId: string,
    source: string,
    frequencyCap: number,
    status: AdaptiveCreativeBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.journeyId = journeyId;
    this.source = source;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: AdaptiveCreativeBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveCreativeBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive creative bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"adaptive creative bundle"} ${this.code}`;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): AdaptiveCreativeBundle {
    return new AdaptiveCreativeBundle(
      this.code,
      this.name,
      this.label,
      this.journeyId,
      this.source,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a adaptive creative bundle in status draft. */
export function newAdaptiveCreativeBundle(code: string, name: string): AdaptiveCreativeBundle {
  return new AdaptiveCreativeBundle(code, name, "", "", "", 0, "draft");
}
