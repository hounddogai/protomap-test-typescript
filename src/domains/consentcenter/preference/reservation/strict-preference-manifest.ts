import * as text from "../../../../kit/text.js";

/** Where a strict preference manifest is in its life cycle. */
export type StrictPreferenceManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One strict preference manifest, with what the planners need to act on it. */
export class StrictPreferenceManifest {
  code: string;
  title: string;
  name: string;
  checksum: string;
  attributes: Map<string, string>;
  retries: number;
  variant: string;
  capacity: number;
  status: StrictPreferenceManifestStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    checksum: string,
    attributes: Map<string, string>,
    retries: number,
    variant: string,
    capacity: number,
    status: StrictPreferenceManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.checksum = checksum;
    this.attributes = attributes;
    this.retries = retries;
    this.variant = variant;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictPreferenceManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: StrictPreferenceManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict preference manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedVolume(): number {
    return Math.round((this.retries + this.capacity) * 100) / 100;
  }

  copy(): StrictPreferenceManifest {
    return new StrictPreferenceManifest(
      this.code,
      this.title,
      this.name,
      this.checksum,
      this.attributes,
      this.retries,
      this.variant,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict preference manifest in status planned. */
export function newStrictPreferenceManifest(code: string, title: string): StrictPreferenceManifest {
  return new StrictPreferenceManifest(code, title, "", "", new Map<string, string>(), 0, "", 0, "planned");
}
