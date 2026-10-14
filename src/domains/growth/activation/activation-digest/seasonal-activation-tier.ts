import * as text from "../../../../kit/text.js";

/** Where a seasonal activation tier is in its life cycle. */
export type SeasonalActivationTierStatus = "created" | "validated" | "published" | "retired";

/** A seasonal activation tier. Its code is unique within a tenant. */
export class SeasonalActivationTier {
  code: string;
  name: string;
  variant: string;
  category: string;
  title: string;
  country: string;
  score: number;
  status: SeasonalActivationTierStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    category: string,
    title: string,
    country: string,
    score: number,
    status: SeasonalActivationTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.category = category;
    this.title = title;
    this.country = country;
    this.score = score;
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

  canMoveTo(next: SeasonalActivationTierStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
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

  moveTo(next: SeasonalActivationTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal activation tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): SeasonalActivationTier {
    return new SeasonalActivationTier(
      this.code,
      this.name,
      this.variant,
      this.category,
      this.title,
      this.country,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a seasonal activation tier in status created. */
export function newSeasonalActivationTier(code: string, name: string): SeasonalActivationTier {
  return new SeasonalActivationTier(code, name, "", "", "", "", 0, "created");
}
