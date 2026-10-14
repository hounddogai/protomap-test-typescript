import { SeasonalChallengeAllocation } from "./seasonal-challenge-allocation.js";

/** How screens and exports show a seasonal challenge allocation. */
export class SeasonalChallengeAllocationView {
  code: string;
  name: string;
  frequencyCap: string;
  revision: string;
  active: string;
  version: string;
  region: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    frequencyCap: string,
    revision: string,
    active: string,
    version: string,
    region: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.revision = revision;
    this.active = active;
    this.version = version;
    this.region = region;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalChallengeAllocationView(item: SeasonalChallengeAllocation): SeasonalChallengeAllocationView {
  return new SeasonalChallengeAllocationView(
    item.code,
    item.name,
    String(item.frequencyCap),
    String(item.revision),
    `${item.active}`,
    String(item.version),
    item.region,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalChallengeAllocationViews(items: SeasonalChallengeAllocation[]): SeasonalChallengeAllocationView[] {
  const views: SeasonalChallengeAllocationView[] = [];
  for (const item of items) {
    views.push(toSeasonalChallengeAllocationView(item));
  }
  return views;
}

export function sumSeasonalChallengeAllocationView(view: SeasonalChallengeAllocationView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedFrequencyCap + parsedRevision + parsedVersion;
}
