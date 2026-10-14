import * as text from "../../../../kit/text.js";

/** Where a opt out manifest is in its life cycle. */
export type OptOutManifestStatus = "created" | "validated" | "published" | "retired";

/** One opt out manifest, with what the planners need to act on it. */
export class OptOutManifest {
  code: string;
  name: string;
  budget: number;
  batchSize: number;
  region: string;
  attributes: Map<string, string>;
  durationMinutes: number;
  notes: string;
  updatedAt: number;
  status: OptOutManifestStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    batchSize: number,
    region: string,
    attributes: Map<string, string>,
    durationMinutes: number,
    notes: string,
    updatedAt: number,
    status: OptOutManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.batchSize = batchSize;
    this.region = region;
    this.attributes = attributes;
    this.durationMinutes = durationMinutes;
    this.notes = notes;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: OptOutManifestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: OptOutManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netLoad(): number {
    return Math.round((this.budget - this.durationMinutes) * 100) / 100;
  }

  copy(): OptOutManifest {
    return new OptOutManifest(
      this.code,
      this.name,
      this.budget,
      this.batchSize,
      this.region,
      this.attributes,
      this.durationMinutes,
      this.notes,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a opt out manifest in status created. */
export function newOptOutManifest(code: string, name: string): OptOutManifest {
  return new OptOutManifest(code, name, 0, 0, "", new Map<string, string>(), 0, "", 0, "created");
}
