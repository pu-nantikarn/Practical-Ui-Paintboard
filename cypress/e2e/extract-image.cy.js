describe('Image Color Extraction & UI Interaction Test', () => {

    beforeEach(() => {
        // ไปที่หน้าเว็บ (ปรับ URL ตามที่คุณใช้งานจริง)
        cy.visit('https://practical-ui-paintboard.vercel.app');

        // สลับไปยังโหมด Image โดยคลิกที่ปุ่ม Toggle ใน Navbar
        cy.get('.toggle-btn').contains('Image').click();

        // จำลองการอัปโหลดรูปภาพผ่าน input[type="file"]
        // หมายเหตุ: ต้องมีไฟล์ picture.jpg อยู่ในโฟลเดอร์ cypress/fixtures/
        cy.get('input[type="file"]').selectFile('cypress/fixtures/picture.jpg', { force: true });

        // รอให้รูปภาพโหลดและอัลกอริทึม Clustering ทำงานเสร็จ
        cy.get('.preview-image', { timeout: 10000 }).should('be.visible');
    });

    it('1. สามารถสกัดสีจากรูปภาพและแสดงแผงควบคุมสีทั้งหมดได้', () => {
        // ตรวจสอบว่าปุ่มดูสีทั้งหมดปรากฏขึ้นหลังจากสกัดสีเสร็จ
        cy.get('.toggle-all-colors-btn').should('be.visible').click();

        // ตรวจสอบว่าแผงควบคุมสี (Panel) แสดงผลขึ้นมา
        cy.get('.all-colors-panel').should('be.visible');

        // ตรวจสอบว่ามีรายการสีที่สกัดได้อย่างน้อย 1 สี
        cy.get('.all-color-item').should('have.length.at.least', 1);
    });

    it('2. สามารถลากสีจากแผงควบคุม ไปวางในช่องสีหลักได้ (Drag & Drop)', () => {
        cy.get('.toggle-all-colors-btn').click();

        // เลือกสีแรกจากแผงควบคุมสี
        cy.get('.all-color-item').first().then(($el) => {
            const colorHex = $el.find('span').text().replace('#', '');

            // จำลองการ Drag and Drop โดยใช้ DataTransfer Object
            const dataTransfer = new DataTransfer();
            cy.wrap($el).trigger('dragstart', { dataTransfer });

            // วาง (Drop) ลงในช่อง Primary Color
            cy.get('.color-group').first().find('.input-wrapper')
                .trigger('drop', { dataTransfer: { getData: () => colorHex } });

            // ตรวจสอบว่าค่าใน Input เปลี่ยนเป็นรหัสสีที่ลากมา
            cy.get('.color-group').first().find('input').should('have.value', colorHex);
        });
    });

    it('3. กดปุ่ม Shuffle Colors แล้วช่องสีมีการเปลี่ยนแปลง', () => {
        // เก็บค่าสีเดิมก่อนกด Shuffle
        cy.get('.color-group').first().find('input').invoke('val').then((oldPrimary) => {

            // ตรวจสอบว่าปุ่ม Shuffle ปรากฏขึ้นและกดปุ่ม
            cy.get('.shuffle-btn')
                .scrollIntoView() // เลื่อนไปให้เห็นปุ่ม
                .should('be.visible')
                .click();

            // ตรวจสอบว่าค่าสีใหม่ไม่เหมือนกับค่าสีเดิม (กรณีที่สกัดได้หลายสี)
            cy.get('.color-group').first().find('input').should('not.have.value', oldPrimary);
        });
    });

    it('4. หน้า preview dashboard มีการเปลี่ยนสีตามสีที่เปลี่ยนไปเมื่อกดปุ่ม shuffle', () => {
        // กด Shuffle เพื่อเปลี่ยนสีชุดใหม่
        cy.get('.shuffle-btn')
            .scrollIntoView() // เลื่อนไปให้เห็นปุ่ม
            .should('be.visible')
            .click();

        cy.wait(500);

        cy.get('.color-group').first().find('input').invoke('val').then((currentHex) => {
            const expectedRgb = hexToRgb(currentHex);

            // 2. ตรวจสอบ "ไอคอน KPI ตัวแรก" เพราะในโค้ดใช้ pColor แน่นอน
            // หมายเหตุ: เช็ค 'color' ไม่ใช่ 'background-color' ตามที่เขียนใน PreviewDashboard
            cy.get('.kpi-icon').first()
                .should('have.css', 'color', `rgb(${expectedRgb.r}, ${expectedRgb.g}, ${expectedRgb.b})`);

            // 3. หากจะเช็คจุดใน Gauge Chart ต้องมั่นใจว่าเป็นตัวที่ใช้ pColor 
            // หรือเลี่ยงไปเช็ค "เส้นกราฟเส้นแรก" แทนครับ
            cy.get('.mock-line-chart polyline').first()
                .should('have.attr', 'stroke', `#${currentHex}`);
        });
    });
});

// Helper function สำหรับแปลง Hex เป็น RGB เพื่อตรวจสอบ CSS ใน Cypress
function hexToRgb(hex) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
}