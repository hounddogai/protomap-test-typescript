import * as text from "../../../../kit/text.js";

/** Where a reputation template is in its life cycle. */
export type ReputationTemplateStatus = "created" | "validated" | "published" | "retired";

/** A reputation template. Its code is unique within a tenant. */
export class ReputationTemplate {
  code: string;
  title: string;
  region: string;
  maximum: number;
  source: string;
  batchSize: number;
  pinned: boolean;
  revision: number;
  version: number;
  attributes: Map<string, string>;
  cost: number;
  status: ReputationTemplateStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    maximum: number,
    source: string,
    batchSize: number,
    pinned: boolean,
    revision: number,
    version: number,
    attributes: Map<string, string>,
    cost: number,
    status: ReputationTemplateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.maximum = maximum;
    this.source = source;
    this.batchSize = batchSize;
    this.pinned = pinned;
    this.revision = revision;
    this.version = version;
    this.attributes = attributes;
    this.cost = cost;
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

  canMoveTo(next: ReputationTemplateStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
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

  moveTo(next: ReputationTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedExposure(): number {
    return Math.round(this.cost * this.revision * 100) / 100;
  }

  copy(): ReputationTemplate {
    return new ReputationTemplate(
      this.code,
      this.title,
      this.region,
      this.maximum,
      this.source,
      this.batchSize,
      this.pinned,
      this.revision,
      this.version,
      this.attributes,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a reputation template in status created. */
export function newReputationTemplate(code: string, title: string): ReputationTemplate {
  return new ReputationTemplate(code, title, "", 0, "", 0, false, 0, 0, new Map<string, string>(), 0, "created");
}
