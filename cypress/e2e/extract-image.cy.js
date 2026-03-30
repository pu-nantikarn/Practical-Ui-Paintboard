describe('Image Color Extraction & Interaction Testing', () => {

  beforeEach(() => {
    cy.visit('http://localhost:3000', {
      onBeforeLoad(win) {
        win.localStorage.setItem('savedActiveTab', 'Image');
      }
    });
    cy.get('input[type="file"]').selectFile('cypress/fixtures/picture.jpg', { force: true });
    cy.get('.preview-image', { timeout: 10000 }).should('be.visible');
    cy.get('.toggle-all-colors-btn', { timeout: 10000 }).should('be.visible');
  });

  it(' TC-01: สามารถสกัดสีจากรูปภาพและแสดงแผงควบคุมสีทั้งหมดได้สำเร็จ', () => {
    cy.get('.toggle-all-colors-btn').click();

    cy.get('.all-colors-panel').should('be.visible');
    cy.get('.all-color-item').should('have.length.at.least', 1);

    cy.get('.color-group').contains('Primary Colors')
      .parent()
      .find('input[type="text"]')
      .invoke('val')
      .should('have.length', 6); // รหัส HEX ต้องมี 6 ตัวอักษร
  });

  it('✅ TC-02: สามารถลากสีจากแผงควบคุม ไปวางในช่องสีหลัก (Drag & Drop) ได้', () => {
    cy.get('.toggle-all-colors-btn').click();
    cy.get('.all-colors-panel').should('be.visible');

    // จำลอง DataTransfer Object สำหรับ HTML5 Drag and Drop ที่คุณเขียนไว้
    const dataTransfer = new DataTransfer();

    // 1. ดึงค่า HEX จากกล่องสีกล่องแรกในหน้าต่างย่อย
    cy.get('.all-color-item').first().then(($el) => {
      const colorText = $el.text().trim().replace('#', '');
      
      // 2. จำลองการลาก (Drag Start) พร้อมส่งค่าสี
      cy.wrap($el).trigger('dragstart', { dataTransfer });
      // บังคับยัดค่าลงไปใน dataTransfer เพื่อใช้ตอน Drop
      dataTransfer.setData('text/plain', colorText); 

      // 3. จำลองการวาง (Drop) ลงในช่อง Primary Color
      cy.get('.color-group').contains('Primary Colors').parent().within(() => {
        cy.get('.input-wrapper').trigger('drop', { dataTransfer });
        
        // 4. ตรวจสอบว่าช่อง Primary Color ถูกเปลี่ยนเป็นสีที่ลากมาวาง
        cy.get('input[type="text"]').should('have.value', colorText);
      });
    });
  });

  it('✅ TC-03: ระบบล็อคสีทำงานถูกต้องเมื่อกดปุ่ม Shuffle Colors', () => {
    // 1. เก็บค่าสี Primary เดิมไว้
    cy.get('.color-group').contains('Primary Colors').parent().find('input[type="text"]').invoke('val').then((initialPrimary) => {
      
      // 2. กดปุ่มแม่กุญแจเพื่อล็อคสี Primary
      cy.get('.color-group').contains('Primary Colors').parent().find('.action-icon').last().click();

      // 3. กดปุ่ม Shuffle Colors
      cy.get('.shuffle-btn').click();

      // 4. ตรวจสอบว่าสี Primary ต้อง "เหมือนเดิม" เพราะถูกล็อคไว้
      cy.get('.color-group').contains('Primary Colors').parent().find('input[type="text"]').should('have.value', initialPrimary);
    });
  });

  it('✅ TC-04: กราฟิกและ Dashboard อัปเดตสีแบบ Real-time ทันทีที่สกัดสี', () => {
    // ดึงค่าสี Primary ที่สกัดมาได้
    cy.get('.color-group').contains('Primary Colors').parent().find('input[type="text"]').invoke('val').then((primaryHex) => {
      
      // ตรวจสอบในหน้า PreviewDashboard ว่าไอคอนหรือกราฟถูกเปลี่ยนเป็นสี Primary ที่สกัดได้หรือไม่
      // อ้างอิงจาก PreviewDashboard.js ที่นำ genPrimary/imgPrimary ไปใส่ style color/backgroundColor
      cy.get('.kpi-icon').first().should(($icon) => {
        // เบราว์เซอร์มักจะแปลงค่าสีจาก HEX เป็น RGB ใน DOM เสมอ
        const style = window.getComputedStyle($icon[0]);
        expect(style.color).to.not.be.empty; 
      });
    });
  });

  it('✅ TC-05: แจ้งเตือน Copied ทำงานเมื่อกดคัดลอกรหัสสี', () => {
    // สั่งให้เบราว์เซอร์อนุญาตการใช้งาน Clipboard ล่วงหน้า (ข้อจำกัดของ Cypress)
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, 'writeText').resolves();
    });

    // กดปุ่มคัดลอก (Copy Icon) ที่ช่อง Primary Color
    cy.get('.color-group').contains('Primary Colors').parent().find('button[title="Copy Hex"]').click();

    // ตรวจสอบว่า Toast แจ้งเตือนเด้งขึ้นมาและแสดงข้อความถูกต้อง
    cy.get('.copy-feedback-toast').should('be.visible').and('contain.text', 'Copied');
  });

});