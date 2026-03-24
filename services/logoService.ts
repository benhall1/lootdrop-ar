export class LogoService {
  static getBusinessLogo(businessName: string): string | undefined {
    const logoMap: Record<string, string> = {
      "Blue Bottle Coffee": "https://logo.clearbit.com/bluebottlecoffee.com",
      "Tony's Pizzeria": "https://logo.clearbit.com/tonys-pizza.com",
      "Juice Bar": "https://logo.clearbit.com/jamba.com",
      "City Lights Books": "https://logo.clearbit.com/citylights.com",
      "FitZone Gym": "https://logo.clearbit.com/24hourfitness.com",
      "Cinema Palace": "https://logo.clearbit.com/amctheatres.com",
      "Starbucks": "https://logo.clearbit.com/starbucks.com",
      "McDonald's": "https://logo.clearbit.com/mcdonalds.com",
      "Whole Foods": "https://logo.clearbit.com/wholefoodsmarket.com",
      "Target": "https://logo.clearbit.com/target.com",
      "Best Buy": "https://logo.clearbit.com/bestbuy.com",
      "Chipotle": "https://logo.clearbit.com/chipotle.com",
      "Subway": "https://logo.clearbit.com/subway.com",
      "Walgreens": "https://logo.clearbit.com/walgreens.com",
      "CVS": "https://logo.clearbit.com/cvs.com",
      "REI": "https://logo.clearbit.com/rei.com",
    };

    const logo = logoMap[businessName];
    if (logo) return logo;

    const domain = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/\s+/g, "");

    return `https://logo.clearbit.com/${domain}.com`;
  }

}
