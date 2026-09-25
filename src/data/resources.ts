export const resources = {
  blueprint: {
    key: 'blueprint',
    eyebrow: 'Investor Guide',
    title: 'The Investor Blueprint',
    heading: 'Understand Lombok property investment before committing capital.',
    description: 'A structured introduction to Lombok property investment, development pathways, market positioning and Kavara Capital’s investment approach.',
    points: [
      'How Lombok property investment actually works',
      'Key risks many investors overlook',
      'Structured investment pathways explained',
      'Real-world positioning strategies'
    ],
    button: 'Get the Investor Blueprint',
    capturePath: '/get-blueprint/',
    thanksPath: '/thank-you-blueprint/',
    downloadUrl: 'https://kavaracapital.com/blueprint',
    downloadButton: 'Download Investor Blueprint',
    cover: '/images/card-investor-blueprint.jpg',
    coverAlt: 'Kavara Capital Investor Blueprint displayed across digital devices and print'
  },
  smallGroup: {
    key: 'small-group',
    eyebrow: 'Investment Structure',
    title: 'Structured Small Group Entry',
    heading: 'Explore a structured approach to early-stage opportunities in Lombok.',
    description: 'Understand how lower-entry participation can provide access to selected opportunities without requiring hands-on involvement.',
    points: [
      'How structured small-group participation works',
      'Lower-entry access to early-stage opportunities',
      'Flexible pathways: land hold or development',
      'Real-world project structuring explained'
    ],
    button: 'Explore the Structure',
    capturePath: '/small-group-entry/',
    thanksPath: '/small-group-entry-download/',
    downloadUrl: 'https://www.kavaracapital.com/small-group-entry-pdf',
    downloadButton: 'Download Small Group Entry Guide',
    cover: '/images/card-small-group-entry.jpg',
    coverAlt: 'A small group reviewing plans for a structured Lombok opportunity'
  },
  tenQuestions: {
    key: 'ten-questions',
    eyebrow: 'Investor Due Diligence',
    title: '10 Questions Every Lombok Investor Should Ask Before Investing',
    heading: 'Ask better questions before investing in Lombok.',
    description: 'A practical guide to evaluating opportunities, identifying potential risks and conducting more effective due diligence before committing capital.',
    points: [
      'Key legal and ownership checks every investor should perform',
      'How zoning, permits and land-use regulations affect potential',
      'Warning signs that deserve further investigation',
      'How professional investors evaluate risk'
    ],
    button: 'Download Your Free Guide',
    capturePath: '/10-questions-for-investors/',
    thanksPath: '/10-questions-for-investors-download/',
    downloadUrl: 'https://www.kavaracapital.com/10-questions-investor-guide-pdf',
    downloadButton: 'Download the Guide',
    cover: '/images/card-10-questions-guide.jpg',
    coverAlt: '10 Questions Every Lombok Investor Should Ask Before Investing guide'
  }
} as const;

export type Resource = (typeof resources)[keyof typeof resources];
