'use strict';

module.exports = ({ open, eq, ok }) => {
    const panel = (browser, extra = {}) => open(browser, { keywords: [], panelOpen: true, permanentOpen: false, url: 'https://example.test/article', html: '<p id="choose">Solarenergie</p><p>Solarenergie hilft.</p>', ...extra });
    const mark = async page => {
        await page.evaluate(() => {
            const range = document.createRange(); range.selectNodeContents(document.getElementById('choose'));
            getSelection().removeAllRanges(); getSelection().addRange(range);
        });
        await page.keyboard.press('Alt+Shift+H');
        await page.waitForFunction(() => CSS.highlights.get('slim-page')?.size === 2);
        await page.locator('.page-save').click();
    };
    return {
        async compact_panel_saved_passage_uses_less_space_in_both_themes(browser) {
            for (const theme of ['dark', 'light']) {
                const page = await panel(browser, { store: { hl_ui_theme: theme }, viewport: { width: 1280, height: 900 } });
                await mark(page);
                const box = await page.locator('#slim-hl-panel').boundingBox();
                ok(box.width <= 320, 'Kompakte Breite: ' + JSON.stringify(box));
                ok(box.height <= 560, 'Kompakte Höhe: ' + JSON.stringify(box));
                eq(await page.locator('#help-section').getAttribute('open'), null, 'Lange Hilfe standardmäßig zugeklappt');
                eq(await page.locator('#clear-page').isVisible(), true);
                eq(await page.locator('#undo-page').isVisible(), true);
                ok((await page.locator('.page-actions').boundingBox()).height <= 44, 'Seitenaktionen brauchen nur eine Button-Zeile');
                eq(await page.evaluate(() => CSS.highlights.get('slim-page').size), 2);
            }
        },
        async compact_panel_narrow_layout_keeps_touch_targets_and_page_visible(browser) {
            const page = await panel(browser, { viewport: { width: 390, height: 844 } }); await mark(page);
            const box = await page.locator('#slim-hl-panel').boundingBox();
            ok(box.width <= 320 && box.height <= 560, 'Schmales Panel: ' + JSON.stringify(box));
            const shortTargets = await page.locator('#slim-hl-panel button, #slim-hl-panel summary').evaluateAll(els => els.filter(el => {
                const box = el.getBoundingClientRect(); return box.height > 0 && box.height < 44;
            }).map(el => el.id || el.textContent));
            eq(shortTargets.join(','), '', 'Sichtbare Bedienelemente bleiben mindestens 44px hoch');
            await page.setViewportSize({ width: 320, height: 568 });
            await page.waitForFunction(() => document.getElementById('slim-hl-panel').getBoundingClientRect().height <= 455);
        },
        async compact_panel_help_and_settings_expand_without_losing_state(browser) {
            const page = await panel(browser);
            ok(await page.locator('#help-section > summary').count(), 'Hilfe als eigener Bereich vorhanden');
            await page.locator('#help-section > summary').focus(); await page.keyboard.press('Enter');
            eq(await page.locator('#page-shortcut-hint').isVisible(), true);
            ok((await page.locator('#page-shortcut-hint').textContent()).includes('Alt'));
            await page.locator('#settings-section > summary').click();
            await page.selectOption('#ui-lang', 'en');
            eq(await page.locator('#help-section').getAttribute('open'), '');
            eq(await page.locator('#settings-section').getAttribute('open'), '');
            eq(await page.locator('#help-section > summary').textContent(), 'Help & shortcuts');
            const section = await page.locator('#settings-section').boundingBox();
            const body = await page.locator('.panel-body').boundingBox();
            ok(section.width >= body.width - 30, 'Offener Bereich nutzt die volle Breite');
            eq(await page.locator('.panel-body').evaluate(el => el.scrollWidth > el.clientWidth), false);
        },
    };
};
