/**
 * The model slot records of attribution's model work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a model slot is in its life cycle. */
export type ModelSlotStatus = "created" | "validated" | "published" | "retired";

/** A model slot as the model team keeps it. */
export class ModelSlot {
  code: string;
  title: string;
  contactEmail: string;
  ratio: number;
  description: string;
  threshold: number;
  impressions: number;
  score: number;
  journeyId: string;
  country: string;
  budget: number;
  status: ModelSlotStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    ratio: number,
    description: string,
    threshold: number,
    impressions: number,
    score: number,
    journeyId: string,
    country: string,
    budget: number,
    status: ModelSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.ratio = ratio;
    this.description = description;
    this.threshold = threshold;
    this.impressions = impressions;
    this.score = score;
    this.journeyId = journeyId;
    this.country = country;
    this.budget = budget;
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

  canMoveTo(next: ModelSlotStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ModelSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveVolume(): number {
    return Math.round((this.budget - this.impressions) * 100) / 100;
  }

  copy(): ModelSlot {
    return new ModelSlot(
      this.code,
      this.title,
      this.contactEmail,
      this.ratio,
      this.description,
      this.threshold,
      this.impressions,
      this.score,
      this.journeyId,
      this.country,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a model slot in status created. */
export function newModelSlot(code: string, title: string): ModelSlot {
  return new ModelSlot(code, title, "", 0, "", 0, 0, 0, "", "", 0, "created");
}
