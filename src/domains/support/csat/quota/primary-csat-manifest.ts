import * as text from "../../../../kit/text.js";

/** Where a primary csat manifest is in its life cycle. */
export type PrimaryCsatManifestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One primary csat manifest, with what the planners need to act on it. */
export class PrimaryCsatManifest {
  code: string;
  name: string;
  revision: number;
  retries: number;
  maximum: number;
  budget: number;
  margin: number;
  status: PrimaryCsatManifestStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    retries: number,
    maximum: number,
    budget: number,
    margin: number,
    status: PrimaryCsatManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.retries = retries;
    this.maximum = maximum;
    this.budget = budget;
    this.margin = margin;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryCsatManifestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryCsatManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary csat manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"primary csat manifest"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.budget - this.revision) * 100) / 100;
  }

  copy(): PrimaryCsatManifest {
    return new PrimaryCsatManifest(
      this.code,
      this.name,
      this.revision,
      this.retries,
      this.maximum,
      this.budget,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary csat manifest in status open. */
export function newPrimaryCsatManifest(code: string, name: string): PrimaryCsatManifest {
  return new PrimaryCsatManifest(code, name, 0, 0, 0, 0, 0, "open");
}
