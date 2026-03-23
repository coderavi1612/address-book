import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { AddressBlock, GridConfig } from '@/types/block';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 0,
  },
  block: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderStyle: 'solid',
    padding: 8,
    backgroundColor: '#ffffff',
  },
  name: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    fontWeight: 400,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  mobile: {
    fontSize: 12,
    fontWeight: 400,
    color: '#1a1a1a',
  },
});

interface PDFDocumentProps {
  blocks: AddressBlock[];
  gridConfig: GridConfig;
  orientation?: 'portrait' | 'landscape';
}

export function PDFDocument({ blocks, gridConfig, orientation = 'portrait' }: PDFDocumentProps) {
  // For PDF, fill the entire page with no margins — easier to cut
  const pdfUnitWidth = gridConfig.pageWidth / gridConfig.columns;
  const pdfUnitHeight = gridConfig.pageHeight / gridConfig.rows;

  // Group blocks by page_number
  const pageGroups = blocks.reduce((acc, block) => {
    if (!acc[block.page_number]) {
      acc[block.page_number] = [];
    }
    acc[block.page_number].push(block);
    return acc;
  }, {} as Record<number, AddressBlock[]>);
  
  // Get sorted page numbers
  const pageNumbers = Object.keys(pageGroups)
    .map(Number)
    .sort((a, b) => a - b);
  
  return (
    <Document>
      {pageNumbers.map((pageNum) => (
        <Page 
          key={pageNum} 
          size="A4" 
          orientation={orientation}
          style={styles.page}
        >
          {pageGroups[pageNum].map((block) => (
            <View
              key={block.id}
              style={[
                styles.block,
                {
                  left: block.x * pdfUnitWidth,
                  top: block.y * pdfUnitHeight,
                  width: block.width * pdfUnitWidth,
                  height: block.height * pdfUnitHeight,
                },
              ]}
            >
              {block.names.map((name, idx) => (
                <Text key={idx} style={styles.name}>
                  {name}
                </Text>
              ))}
              <Text style={styles.address}>{block.address}</Text>
              {block.mobile && <Text style={styles.mobile}>{block.mobile}</Text>}
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );
}
