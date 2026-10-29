'use strict';

module.exports = ({ open, eq, ok }) => {
    const settings = async page => page.locator('#settings-section').evaluate(el => { el.open = true; });
    const launcherWidth = async page => Math.round((await page.locator('#slim-hl-toggle').boundingBox()).width);
    const selectText = async page => {
        await page.evaluate(() => {
            document.activeElement?.blur();
            const range = document.createRange();
            range.selectNodeContents(document.getElementById('passage'));
            getSelection().removeAllRanges(); getSelection().addRange(range);
        });
        await page.locator('#selection-trigger').waitFor({ state: 'visible' });
    };
    return {
        async appearance_selection_logo_replaces_retired_button_preference(browser) {
            const page=await open(browser,{panelOpen:true,keywords:[],store:{hl_selection_style:'button'},html:'<p id="passage">Solarenergie</p>'});
            await selectText(page);
            const check=async()=>{
                eq(await page.locator('#selection-trigger img').getAttribute('src'),await page.locator('#slim-hl-header img').getAttribute('src'),'Existing installations use the same full logo as the panel opener');
                eq(await page.locator('#selection-trigger').evaluate(el=>getComputedStyle(el).borderTopWidth),'0px','Logo has no additional button frame');
                eq(await page.locator('#selection-trigger img').evaluate(el=>Math.round(el.getBoundingClientRect().width)),40,'Full logo remains readable');
            };
            await check();await settings(page);await page.selectOption('#ui-theme','light');await check();
            await page.selectOption('#ui-lang','en');await selectText(page);await check();
        },
        async appearance_transparency_applies_to_all_surfaces_and_restores(browser) {
            const page = await open(browser, { panelOpen: true, keywords: [], store: { hl_launcher_size: 64 }, html: '<p id="passage">Solarenergie</p>' });
            await selectText(page); await settings(page);
            const slider = page.getByRole('slider', { name: 'Transparenz der Bedienelemente', exact: true });
            await slider.focus(); await page.keyboard.press('Home');
            for (let i=0;i<7;i++) await page.keyboard.press('ArrowRight');
            eq(await slider.inputValue(), '35'); eq(await page.locator('#ui-transparency-value').textContent(), '35 %');
            for (const id of ['slim-hl-panel','slim-selection-tools','slim-hl-toggle']) eq(await page.locator('#'+id).evaluate(el=>getComputedStyle(el).opacity), '0.65', id+' is translucent');
            eq(await page.evaluate(()=>window.__store.hl_ui_transparency),35,'Preference persisted');
            await page.selectOption('#ui-theme','light');
            eq(await page.locator('#slim-hl-panel').evaluate(el=>getComputedStyle(el).opacity),'0.65','Theme changes preserve transparency');
            await page.selectOption('#ui-lang','en');
            eq(await page.getByRole('slider',{name:'Interface transparency',exact:true}).inputValue(),'35','Locale recreation retains setting');
            const restored = await open(browser,{panelOpen:true,keywords:[],store:await page.evaluate(()=>window.__store)});
            eq(await restored.locator('#slim-hl-toggle').evaluate(el=>getComputedStyle(el).opacity),'0.65','Restored launcher is translucent');
            await restored.locator('#settings-section').evaluate(el=>{el.open=true;});
            await restored.getByRole('button',{name:'Reset transparency',exact:true}).click();
            eq(await restored.locator('#slim-hl-panel').evaluate(el=>getComputedStyle(el).opacity),'1');
            eq(await restored.evaluate(()=>window.__store.hl_ui_transparency),0);
            eq(await restored.locator('#slim-hl-toggle').evaluate(el=>Math.round(el.getBoundingClientRect().width)),64,'Reset only changes transparency');
        },
        async appearance_transparency_invalid_values_are_bounded(browser) {
            for (const [value,expected] of [[1000,80],[-12,0],['broken',0],[37,35]]) {
                const page=await open(browser,{panelOpen:true,keywords:[],store:{hl_ui_transparency:value}});
                await settings(page);
                eq(await page.locator('#ui-transparency').inputValue(),String(expected),'Stored preference normalized');
                eq(await page.locator('#slim-hl-toggle').evaluate(el=>getComputedStyle(el).opacity),String((100-expected)/100));
                await page.close();
            }
        },
        async appearance_transparency_failed_write_restores_and_can_retry(browser) {
            const page=await open(browser,{panelOpen:true,keywords:[],store:{hl_ui_transparency:30}});await settings(page);
            await page.evaluate(()=>{window.__write=GM_setValue;window.GM_setValue=(key,value)=>{if(key==='hl_ui_transparency')throw Error('quota');window.__write(key,value);};});
            await page.locator('#ui-transparency').focus();await page.keyboard.press('ArrowRight');
            eq(await page.locator('#ui-transparency').inputValue(),'30','Failed write rolls slider back');
            eq(await page.locator('#slim-hl-toggle').evaluate(el=>getComputedStyle(el).opacity),'0.7','Failed write rolls appearance back');
            ok((await page.locator('#panel-status').textContent()).includes('nicht gespeichert'),'Failure is visible');
            await page.evaluate(()=>{window.GM_setValue=window.__write;});await page.keyboard.press('ArrowRight');
            eq(await page.evaluate(()=>window.__store.hl_ui_transparency),35,'Retry saves preference');
            eq(await page.locator('#panel-status').textContent(),'','Successful retry clears failure');
        },
        async appearance_logo_follows_theme_on_every_surface(browser) {
            const page = await open(browser, { panelOpen: true, keywords: [], store: { hl_ui_theme: 'dark' }, html: '<p id="passage">Solarenergie</p>' });
            await selectText(page);
            const checkLogo = async theme => {
                const logo = await page.locator('#slim-hl-header img').getAttribute('src');
                ok(logo.startsWith('data:image/svg+xml;base64,'), 'Theme logo is embedded without network requests');
                const selectionLogo = await page.locator('#selection-trigger img').getAttribute('src');
                const selectionPixels = await page.evaluate(async source => {
                    const image = new Image(); image.src = source; await image.decode();
                    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
                    const context = canvas.getContext('2d'); context.drawImage(image, 0, 0, 128, 128);
                    return { background: [...context.getImageData(64, 114, 1, 1).data], track: [...context.getImageData(105, 27, 1, 1).data] };
                }, selectionLogo);
                eq(selectionPixels.background[3], 255, 'Selection uses the complete logo tile');
                const trackBrightness = selectionPixels.track.slice(0,3).reduce((a,b)=>a+b,0)/3;
                ok(theme === 'dark' ? trackBrightness < 120 : trackBrightness > 180, 'Selection mark details follow the active theme');
                ok((await page.locator('#slim-hl-toggle').evaluate(el => getComputedStyle(el).backgroundImage)).includes(logo), 'Launcher shares the current theme logo');
                const brightness = await page.evaluate(async source => {
                    const image = new Image(); image.src = source; await image.decode();
                    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
                    const context = canvas.getContext('2d'); context.drawImage(image, 0, 0, 128, 128);
                    const [r,g,b] = context.getImageData(64, 114, 1, 1).data;
                    return (r+g+b)/3;
                }, logo);
                ok(theme === 'dark' ? brightness < 90 : brightness > 220, 'Rendered logo background matches '+theme+' theme; brightness '+brightness);
                return logo;
            };
            const dark = await checkLogo('dark');
            await settings(page); await page.selectOption('#ui-theme','light');
            const light = await checkLogo('light'); ok(light !== dark, 'Themes use distinct logo variants');
            await page.selectOption('#ui-theme','dark'); eq(await checkLogo('dark'), dark, 'Returning to dark restores the dark logo');
            const restored = await open(browser, { panelOpen: true, keywords: [], store: await page.evaluate(()=>window.__store) });
            eq(await restored.locator('#slim-hl-header img').getAttribute('src'), dark, 'Saved dark theme restores its logo');
        },
        async appearance_selection_action_icons_fit_narrow_viewports(browser) {
            for (const width of [320, 390]) for (const lang of ['de', 'en']) {
                const page = await open(browser, { viewport: { width, height: 700 }, keywords: [], store: { hl_ui_theme: 'light', hl_lang: lang }, html: '<style>body{margin:0;font:18px/1.8 system-ui;padding:24px}</style><p>Neue Wege beginnen mit Forschung. <b id="passage">Solarenergie</b> ist ein wichtiger Teil davon.</p>' });
                await selectText(page);
                await page.locator('#selection-trigger').hover();
                const box = await page.locator('#slim-selection-tools').boundingBox();
                ok(box.x >= 8 && box.x + box.width <= width - 8 + 1, 'Expanded selection actions retain viewport margins: '+JSON.stringify({width,lang,box}));
                for (const id of ['selection-highlight', 'selection-web']) {
                    eq(await page.locator('#'+id+' svg').getAttribute('aria-hidden'), 'true', 'Decorative action icon');
                    const target=await page.locator('#'+id).boundingBox();
                    ok(target.height>=44 && target.x>=box.x && target.x+target.width<=box.x+box.width, 'Labeled action stays reachable');
                }
                await page.close();
            }
        },
        async appearance_host_control_ids_are_untouched(browser) {
            const page = await open(browser, { panelOpen: true, keywords: [], store: { hl_ui_theme: 'light', hl_launcher_size: 72, hl_launcher_position: 'top-left', hl_launcher_inset: 28 }, html: '<main id="host"><select id="ui-theme"><option value="host">Host</option><option value="light">Light</option></select><input id="launcher-size" value="host"><output id="launcher-size-value">host</output><select id="launcher-position"><option value="host">Host</option><option value="top-left">Top left</option></select><input id="launcher-inset" value="host"><output id="launcher-inset-value">host</output></main>' });
            for (const id of ['ui-theme', 'launcher-size', 'launcher-size-value', 'launcher-position', 'launcher-inset', 'launcher-inset-value']) {
                eq(await page.locator('#host #' + id).evaluate(el => el.value), 'host', 'Fremdes Feld bleibt unverändert: ' + id);
            }
            const owned = page.locator('#slim-hl-panel');
            eq(await owned.locator('#ui-theme').inputValue(), 'light');
            eq(await owned.locator('#launcher-size').inputValue(), '72');
            eq(await owned.locator('#launcher-position').inputValue(), 'top-left');
            eq(await owned.locator('#launcher-inset').inputValue(), '28');
        },
        async appearance_launcher_position_and_inset_restore(browser) {
            const page = await open(browser, { panelOpen: true, viewport: { width: 390, height: 650 } });
            await settings(page);
            eq(await page.getByLabel('Position des Öffnen-Buttons', { exact: true }).count(), 1, 'Position ist beschriftet einstellbar');
            for (const position of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) {
                await page.selectOption('#launcher-position', position);
                const box = await page.locator('#slim-hl-toggle').boundingBox();
                eq(Math.round(position.endsWith('left') ? box.x : 390 - box.x - box.width), 20, 'Horizontale Ecke');
                eq(Math.round(position.startsWith('top') ? box.y : 650 - box.y - box.height), 20, 'Vertikale Ecke');
            }
            await page.selectOption('#launcher-position', 'top-left');
            await page.locator('#launcher-inset').focus();
            await page.keyboard.press('ArrowRight');
            const box = await page.locator('#slim-hl-toggle').boundingBox();
            eq(Math.round(box.x), 24); eq(Math.round(box.y), 24);
            eq(await page.evaluate(() => window.__store.hl_launcher_position), 'top-left');
            eq(await page.evaluate(() => window.__store.hl_launcher_inset), 24);
            const restored = await open(browser, { store: await page.evaluate(() => window.__store) });
            const next = await restored.locator('#slim-hl-toggle').boundingBox();
            eq(Math.round(next.x), 24); eq(Math.round(next.y), 24);
        },
        async appearance_light_theme_applies_to_panel_and_selection_tools(browser) {
            const page = await open(browser, { panelOpen: true, keywords: [], store: { hl_ui_theme: 'light' }, html: '<style>body{background:#123456;color:#ffffff}</style><p id="passage">Solarenergie</p>' });
            eq(await page.locator('#slim-hl-panel').evaluate(el => getComputedStyle(el).colorScheme), 'light', 'Gespeichertes helles Schema angewandt');
            eq(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(18, 52, 86)', 'Host-Farben bleiben erhalten');
            await selectText(page);
            eq(await page.locator('#slim-selection-tools').evaluate(el => getComputedStyle(el).colorScheme), 'light', 'Toolbar folgt dem Schema');
            await settings(page);
            await page.selectOption('#ui-theme', 'dark');
            eq(await page.locator('#slim-selection-tools').evaluate(el => getComputedStyle(el).colorScheme), 'dark', 'Existierende Toolbar wird sofort aktualisiert');
            eq(await page.evaluate(() => window.__store.hl_ui_theme), 'dark');
            await page.selectOption('#ui-theme', 'light');
            const restored = await open(browser, { panelOpen: true, keywords: [], store: await page.evaluate(() => window.__store) });
            eq(await restored.locator('#slim-hl-panel').evaluate(el => getComputedStyle(el).colorScheme), 'light', 'Schema wird bei Wiederbesuch geladen');
        },
        async appearance_launcher_size_updates_with_keyboard_and_restores(browser) {
            const page = await open(browser, { panelOpen: true });
            eq(await launcherWidth(page), 56, 'Neuer größerer Standard');
            await settings(page);
            await page.locator('#launcher-size').focus();
            await page.keyboard.press('ArrowRight');
            eq(await launcherWidth(page), 60, 'Tastatur ändert die Größe sofort');
            eq(await page.evaluate(() => window.__store.hl_launcher_size), 60, 'Größe gespeichert');
            eq(await page.locator('#launcher-size-value').textContent(), '60 px', 'Wert sichtbar');
            eq(await page.evaluate(() => document.activeElement.id), 'launcher-size', 'Fokus bleibt am Regler');
            const restored = await open(browser, { store: await page.evaluate(() => window.__store) });
            eq(await launcherWidth(restored), 60, 'Größe bei Wiederbesuch geladen');
            await page.click('#reset-launcher-size');
            eq(await launcherWidth(page), 56, 'Standard wiederhergestellt');
            eq(await page.evaluate(() => window.__store.hl_launcher_size), 56);
        },
        async appearance_invalid_saved_values_stay_inside_narrow_viewport(browser) {
            for (const [value, expected] of [[1000, 80], [-5, 44], ['broken', 56]]) {
                const page = await open(browser, { viewport: { width: 240, height: 400 }, store: { hl_ui_theme: 'broken', hl_launcher_size: value } });
                eq(await launcherWidth(page), expected, 'Ungültige Größe wird begrenzt');
                const box = await page.locator('#slim-hl-toggle').boundingBox();
                ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 240 && box.y + box.height <= 400, 'Öffnen-Button bleibt erreichbar');
                await page.click('#slim-hl-toggle');
                eq(await page.locator('#slim-hl-panel').evaluate(el => getComputedStyle(el).colorScheme), 'dark', 'Unbekanntes Farbschema fällt auf Dunkel zurück');
            }
        },
        async appearance_locale_and_theme_keep_drafts_and_preferences(browser) {
            const page = await open(browser, { panelOpen: true, store: { hl_ui_theme: 'light', hl_launcher_size: 72 } });
            await page.fill('#new-kw', 'Unfertiger Entwurf');
            await settings(page);
            eq(await page.getByLabel('Farbschema', { exact: true }).count(), 1);
            eq(await page.getByLabel('Größe des Öffnen-Buttons', { exact: true }).count(), 1);
            await page.selectOption('#ui-lang', 'en');
            eq(await page.getByLabel('Color theme', { exact: true }).inputValue(), 'light');
            eq(await page.getByLabel('Open button size', { exact: true }).inputValue(), '72');
            eq(await page.locator('#new-kw').inputValue(), 'Unfertiger Entwurf');
            eq(await launcherWidth(page), 72);
            await page.selectOption('#ui-theme', 'dark');
            eq(await page.locator('#new-kw').inputValue(), 'Unfertiger Entwurf', 'Farbumschaltung baut Panel nicht neu auf');
        },
        async appearance_light_text_and_keyboard_focus_have_contrast(browser) {
            const page = await open(browser, { panelOpen: true, store: { hl_ui_theme: 'light' } });
            await settings(page);
            await page.locator('#ui-theme').focus();
            const ratios = await page.evaluate(() => {
                const luminance = color => {
                    const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(x => x / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
                    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
                };
                const ratio = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
                const panel = getComputedStyle(document.getElementById('slim-hl-panel'));
                const background = luminance(panel.backgroundColor);
                const text = ['#page-heading', '#navigation-scope', '#hl-counter', '#form-error'].map(selector => ratio(luminance(getComputedStyle(document.querySelector(selector)).color), background));
                const focus = getComputedStyle(document.getElementById('ui-theme'));
                return { text, focus: ratio(luminance(focus.outlineColor), luminance(focus.backgroundColor)), style: focus.outlineStyle };
            });
            ok(ratios.text.every(value => value >= 4.5), 'Helle Texte einschließlich Status/Fehler: ' + JSON.stringify(ratios));
            ok(ratios.focus >= 3 && ratios.style !== 'none', 'Fokus sichtbar: ' + JSON.stringify(ratios));
        },
        async appearance_failed_preference_write_restores_controls(browser) {
            const page = await open(browser, { panelOpen: true });
            await settings(page);
            ok(await page.locator('#ui-theme').count(), 'Farbschema-Auswahl vorhanden');
            await page.evaluate(() => { window.GM_setValue = () => { throw Error('quota'); }; });
            await page.selectOption('#ui-theme', 'light');
            eq(await page.locator('#ui-theme').inputValue(), 'dark', 'Fehlgeschlagene Änderung zurückgerollt');
            eq(await page.locator('#slim-hl-panel').evaluate(el => getComputedStyle(el).colorScheme), 'dark');
            ok((await page.locator('#panel-status').textContent()).includes('gespeichert'), 'Speicherfehler erklärt');
            eq((page.__errors || []).length, 0, 'Kein unbehandelter Fehler');
            await page.evaluate(() => { window.GM_setValue = (key, value) => { window.__store[key] = value; }; });
            await page.selectOption('#ui-theme', 'light');
            eq(await page.locator('#panel-status').textContent(), '', 'Erfolgreicher erneuter Versuch entfernt veralteten Fehler');
        },
    };
};
