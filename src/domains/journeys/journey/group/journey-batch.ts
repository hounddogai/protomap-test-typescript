import * as text from "../../../../kit/text.js";

/** Where a journey batch is in its life cycle. */
export type JourneyBatchStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A journey batch. Its code is unique within a tenant. */
export class JourneyBatch {
  code: string;
  title: string;
  description: string;
  attributes: Map<string, string>;
  channel: string;
  budget: number;
  tags: string[];
  version: number;
  contactEmail: string;
  status: JourneyBatchStatus;

  constructor(
    code: string,
    title: string,
    description: string,
    attributes: Map<string, string>,
    channel: string,
    budget: number,
    tags: string[],
    version: number,
    contactEmail: string,
    status: JourneyBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.description = description;
    this.attributes = attributes;
    this.channel = channel;
    this.budget = budget;
    this.tags = tags;
    this.version = version;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: JourneyBatchStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: JourneyBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"journey batch"} ${this.code}`;
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

  effectiveTotal(): number {
    return Math.round((this.budget - this.version) * 100) / 100;
  }

  copy(): JourneyBatch {
    return new JourneyBatch(
      this.code,
      this.title,
      this.description,
      this.attributes,
      this.channel,
      this.budget,
      this.tags,
      this.version,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a journey batch in status proposed. */
export function newJourneyBatch(code: string, title: string): JourneyBatch {
  return new JourneyBatch(code, title, "", new Map<string, string>(), "", 0, [], 0, "", "proposed");
}
