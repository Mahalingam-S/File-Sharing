const classifyFile = (filename, mimeType) => {
  const name = filename.toLowerCase();
  
  // Categorization Rules based on Filename Patterns
  if (name.includes('assignment') || name.includes('hw') || name.includes('homework') || name.includes('project')) {
    return 'Assignments';
  }
  if (name.includes('circular') || name.includes('notice') || name.includes('announcement') || name.includes('memo')) {
    return 'Circulars';
  }
  if (name.includes('lab') || name.includes('record') || name.includes('experiment') || name.includes('practical')) {
    return 'Lab Records';
  }
  if (name.includes('question') || name.includes('paper') || name.includes('exam') || name.includes('test') || name.includes('quiz') || name.includes('midterm')) {
    return 'Question Papers';
  }
  if (name.includes('research') || name.includes('paper') || name.includes('journal') || name.includes('thesis') || name.includes('publication')) {
    return 'Research Papers';
  }
  if (name.includes('syllabus') || name.includes('curriculum')) {
    return 'Syllabus';
  }
  if (name.includes('lecture') || name.includes('notes') || name.includes('slides') || name.includes('presentation')) {
    return 'Lecture Notes';
  }

  // Fallback based on MIME types
  if (mimeType.startsWith('image/')) return 'Images';
  if (mimeType.startsWith('video/')) return 'Videos';
  if (mimeType.includes('pdf')) return 'Documents';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'Spreadsheets';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Presentations';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'Archives';
  if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml')) return 'Text Files';

  return 'Uncategorized';
};

module.exports = { classifyFile };
