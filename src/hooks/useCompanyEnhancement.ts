import companyData from '../../data/company-data.json';

export function useCompanyEnhancement(companyName: string) {
  if (!companyName) return { color: null, badge: null };
  
  const name = companyName.toLowerCase();
  
  // Check Fortune 500
  if (companyData.fortune500.some(company => 
    name.includes(company.toLowerCase())
  )) {
    return { color: companyData.colors.fortune500, badge: 'Fortune 500' };
  }
  
  // Check Unicorns
  if (companyData.unicorns.some(company => 
    name.includes(company.toLowerCase())
  )) {
    return { color: companyData.colors.unicorn, badge: 'Unicorn' };
  }
  
  // Check Industry
  for (const [industry, companies] of Object.entries(companyData.industries)) {
    if (companies.some(company => 
      name.includes(company.toLowerCase())
    )) {
      // Here, we cast the industry string to a key of the colors object
      return { color: companyData.colors[industry as keyof typeof companyData.colors], badge: null };
    }
  }
  
  return { color: null, badge: null };
} 