const puppeteer = require('puppeteer');
const utils = require('../../test-utils');
const init = require('../../test-init');
let browser, page;

// parent user credentials
const email = utils.generateRandomBusinessEmail();
const password = '1234567890';

const monitorName = utils.generateRandomString();
const componentName = utils.generateRandomString();

describe('Incident Reports API', () => {
    const operationTimeOut = init.timeout;

    beforeAll(async () => {
        jest.setTimeout(360000);

        browser = await puppeteer.launch(utils.puppeteerLaunchConfig);
        page = await browser.newPage();
        await page.setUserAgent(utils.agent);

        const user = {
            email,
            password,
        };
        // user
        await init.registerUser(user, page);

        // Create component
        await init.addComponent(componentName, page);

        // add new monitor to project
        await init.addNewMonitorToComponent(page, componentName, monitorName);
    });

    afterAll(async done => {
        await browser.close();
        done();
    });

    test(
        'should create 5 incidents and resolved them',
        async (done) => {
            for (let i = 0; i < 4; i++) {
                await init.navigateToMonitorDetails(componentName, monitorName, page);
                await init.pageClick(page, `#monitorCreateIncident_${monitorName}`);
                await init.pageWaitForSelector(page, '#incidentType');
                await init.pageClick(page, '#createIncident');
                await init.pageWaitForSelector(page, '#createIncident', { hidden: true });
                await init.pageClick(page, '#viewIncident-0');
                await init.pageWaitForSelector(page, '#btnAcknowledge_0');
                await init.pageClick(page, '#btnAcknowledge_0');
                await init.pageClick(page, '#btnResolve_0');

                const resolvedConfirmation = await init.pageWaitForSelector(page, '.bs-resolved-green');
                expect(resolvedConfirmation).toBeDefined();
            }
            done();
        },
        operationTimeOut
    );

    test(
        'should resolved all incidents at once',
        async done => {
            await page.goto(utils.DASHBOARD_URL, {
                waitUntil: 'networkidle2'
            })
            await init.pageWaitForSelector(page, '#incidents-close-all-btn');
            await init.pageClick(page, '#incidents-close-all-btn');
            await init.pageWaitForSelector(page, '#closeIncidentButton_0', { hidden: true });
            await page.reload({ waitUntil: 'networkidle2' });

            const closedResolvedIncidents = await init.pageWaitForSelector(page, '#incidents-close-all-btn');
            expect(closedResolvedIncidents).toBeUndefined();
            done();
        },
        operationTimeOut
    );
});
