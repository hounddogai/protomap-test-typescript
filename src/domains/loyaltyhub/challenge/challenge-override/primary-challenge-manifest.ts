import * as text from "../../../../kit/text.js";

/** Where a primary challenge manifest is in its life cycle. */
export type PrimaryChallengeManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a primary challenge manifest and its current status. */
export class PrimaryChallengeManifest {
  code: string;
  name: string;
  startsAt: number;
  tags: string[];
  contactEmail: string;
  attributes: Map<string, string>;
  threshold: number;
  category: string;
  status: PrimaryChallengeManifestStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    tags: string[],
    contactEmail: string,
    attributes: Map<string, string>,
    threshold: number,
    category: string,
    status: PrimaryChallengeManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.tags = tags;
    this.contactEmail = contactEmail;
    this.attributes = attributes;
    this.threshold = threshold;
    this.category = category;
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

  canMoveTo(next: PrimaryChallengeManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PrimaryChallengeManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary challenge manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"primary challenge manifest"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedLoad(): number {
    return Math.round((this.threshold + this.startsAt) * 100) / 100;
  }

  copy(): PrimaryChallengeManifest {
    return new PrimaryChallengeManifest(
      this.code,
      this.name,
      this.startsAt,
      this.tags,
      this.contactEmail,
      this.attributes,
      this.threshold,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a primary challenge manifest in status planned. */
export function newPrimaryChallengeManifest(code: string, name: string): PrimaryChallengeManifest {
  return new PrimaryChallengeManifest(code, name, 0, [], "", new Map<string, string>(), 0, "", "planned");
}
