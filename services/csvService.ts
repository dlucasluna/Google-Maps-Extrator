import { utils, write } from 'xlsx';
import { BusinessContact } from '../types';

export const exportToExcel = (data: BusinessContact[], filename: string) => {
  // Map data to Portuguese headers for the Excel sheet
  const formattedData = data.map(item => ({
    'Nome': item.name,
    'Telefone': item.phone,
    'Email': item.email,
    'Endereço': item.address,
    'Website': item.website,
    'Avaliação': item.rating,
    'Tipo': item.type
  }));

  // Create a new worksheet from the JSON data
  const worksheet = utils.json_to_sheet(formattedData);

  // Set column widths for better readability
  worksheet['!cols'] = [
    { wch: 35 }, // Nome
    { wch: 18 }, // Telefone
    { wch: 30 }, // Email
    { wch: 50 }, // Endereço
    { wch: 30 }, // Website
    { wch: 10 }, // Avaliação
    { wch: 20 }  // Tipo
  ];

  // Create a new workbook and append the worksheet
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Leads");

  // Generate the Excel file as a binary array
  const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });

  // Create a Blob from the buffer
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  // Create a temporary link to trigger the download
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};