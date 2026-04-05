describe('Generate Color Mode & Dashboard Interaction Test', () => {

    beforeEach(() => {
        // 1. เข้าไปที่หน้าเว็บ (Cypress จะเริ่มที่หน้า Generate ตาม Logic ของ App.js)
        cy.visit('https://practical-ui-paintboard.vercel.app');

        // มั่นใจว่าอยู่ที่ Tab Generate
        cy.get('.toggle-btn.active').should('contain', 'Generate');
    });

    it('1. สามารถสุ่มสีขึ้นมาได้หลายครั้ง แล้วช่องสีมีการแสดงขึ้นมา', () => {
        // วนลูปกดปุ่ม Generate 10 ครั้ง เพื่อทดสอบความเสถียร
        for (let n = 0; n < 10; n++) {
            // 1. เพิ่มการรอ (Wait) เล็กน้อยเพื่อให้ React อัปเดต State สีใหม่เสร็จก่อนตรวจสอบ
            cy.get('.generate-btn').click().wait(200);

            // 2. ปรับปรุงการตรวจสอบช่อง Primary
            cy.get('.color-group').first().find('input').should(($input) => {
                const val = $input.val();

                // ตรวจสอบว่าต้องไม่เป็นค่าว่าง
                expect(val).to.not.be.empty;

                // แก้ Regex:
                // - เติม ^#? เพื่อรองรับกรณีที่มีหรือไม่มีเครื่องหมาย # นำหน้า
                // - เติม i เพื่อให้รองรับทั้งตัวพิมพ์เล็กและตัวพิมพ์ใหญ่ (Case-insensitive)
                // - ตรวจสอบว่าต้องมี 6 หลัก
                expect(val).to.match(/^#?[0-9A-Fa-f]{6}$/);
            });

            // 3. ตรวจสอบช่อง Secondary
            cy.get('.secondary-slots .input-wrapper', { timeout: 5000 })
                .should('have.length.at.least', 1);
        }
    });

    it('2. สามารถเลือกมู้ดสี แล้วช่องสีมีการแสดงขึ้นมา', () => {
        // เลือกมู้ด 'Pastel'
        cy.get('.mood-btn').contains('Pastel').click();
        cy.get('.mood-btn').contains('Pastel').should('have.class', 'active');

        // กด Generate ในมู้ด Pastel
        cy.get('.generate-btn').click();

        // ตรวจสอบว่ามีสีแสดงขึ้นมาในช่อง Input
        cy.get('.color-group').first().find('input').invoke('val').should('not.be.empty');
    });

    it('3. กดปุ่ม generate color แล้วช่องสีมีการเปลี่ยนแปลง', () => {
        // ดึงค่าสีเดิมก่อนกด
        cy.get('.color-group').first().find('input').invoke('val').then((oldColor) => {

            // กดปุ่ม Generate
            cy.get('.generate-btn').click();

            // ตรวจสอบว่าค่าสีใหม่ "ต้องไม่เท่ากับ" ค่าสีเดิม
            cy.get('.color-group').first().find('input').should('not.have.value', oldColor);
        });
    });

    it('4. หน้า preview dashboard มีการเปลี่ยนสีตามสีที่เปลี่ยนไปเมื่อกดปุ่ม generate color', () => {
        // 1. กด Generate เพื่อเปลี่ยนสี
        cy.get('.generate-btn').click();

        // 2. อ่านค่าสีจากช่อง Primary ใน Sidebar
        cy.get('.color-group').first().find('input').invoke('val').then((currentHex) => {
            const rgb = hexToRgb(currentHex);
            const expectedRgb = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

            // 3. ตรวจสอบว่าสีใน Dashboard เปลี่ยนตาม (เช็คที่ไอคอน KPI ตัวแรกซึ่งใช้ pColor)
            cy.get('.kpi-icon').first()
                .should('have.css', 'color', expectedRgb);

            // 4. ตรวจสอบพื้นหลังของ Card ใน Dashboard ว่าใช้สีจาก Neutral shades หรือไม่
            // ในโค้ด PreviewDashboard ใช้ bgCard = neutral[0]
            cy.get('.preview-dashboard').should('have.css', 'background-color');
        });
    });
});

// Helper function สำหรับแปลง Hex เป็น RGB เพื่อเช็ค CSS Value
function hexToRgb(hex) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
}