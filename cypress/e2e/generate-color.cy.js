describe('Color Palette System - Automated Testing', () => {
  
  // ก่อนเริ่มทุก Test Case ให้ไปที่หน้าเว็บหลักก่อน
  beforeEach(() => {
    // เปลี่ยน URL ให้ตรงกับ Port ที่คุณรัน (เช่น 3000 หรือ 5173)
    cy.visit('http://localhost:3000'); 
  });

  it('1. ควรสามารถเลือก Mood และสุ่มสีได้ถูกต้อง', () => {
    // เลือก Mood จาก Dropdown หรือปุ่ม (สมมติว่ามีคำว่า "Pastel")
    cy.contains('Pastel').click();
    
    // กดปุ่ม Generate
    cy.get('button').contains('Generate').click();

    // เช็คว่ามีแถบสีปรากฏขึ้นมา (สมมติว่าใช้ class .color-card)
    cy.get('.input-wrapper').should('have.length.at.least', 5);
    
    // เช็คว่ารหัสสี HEX ขึ้นต้นด้วย #
    cy.get('.input-wrapper').first().should('contain', '#');
  });

  it('2. ควรสามารถสกัดสีจากรูปภาพได้ (Image Extraction)', () => {
    // จำลองการอัปโหลดไฟล์รูปภาพ
    const fileName = 'test-image.png';
    
    // ค้นหา Input Type File และทำการ Select File
    // (หมายเหตุ: ต้องมีรูปชื่อ test-image.png อยู่ในโฟลเดอร์ cypress/fixtures)
    cy.get('input[type="file"]').selectFile(`cypress/fixtures/${fileName}`);

    // รอให้ Canvas ประมวลผล (Clustering)
    cy.wait(1000); 

    // เช็คว่าระบบดึงสีออกมาโชว์ใน Sidebar หรือไม่
    cy.get('.extracted-color-item').should('be.visible')
      .and('have.length.at.least', 1);
  });

  it('3. ควรแจ้งเตือนเมื่อพยายาม Save โดยไม่ Login', () => {
    // กดปุ่ม Save หรือ Like
    cy.get('button').contains('Save').click();

    // เช็คว่ามี Alert หรือ Modal แจ้งเตือนปรากฏขึ้นมา
    cy.on('window:alert', (str) => {
      expect(str).to.equal('กรุณาลงชื่อเข้าใช้ก่อนกดถูกใจจานสีครับ');
    });
  });

});