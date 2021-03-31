const puppeteer = require('puppeteer');
const utils = require('./test-utils');
const init = require('./test-init');
const { Cluster } = require('puppeteer-cluster');
const csvFile = `${__dirname}/MOCKS/subscribers.csv`;
const emptyFile = `${__dirname}/MOCKS/emptyTemplateFile.csv`;
const existingSubscribers = `${__dirname}/MOCKS/existing.csv`;

require('should');

// user credentials
const email = utils.generateRandomBusinessEmail();
const password = '1234567890';
const monitorName = utils.generateRandomString();
const componentName = utils.generateRandomString();

describe('Monitor Detail API', () => {
    const operationTimeOut = 500000;

    let cluster;

    beforeAll(async () => {
        jest.setTimeout(500000);

        cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            puppeteerOptions: utils.puppeteerLaunchConfig,
            puppeteer,
            timeout: utils.timeout,
        });

        cluster.on('taskerror', err => {
            throw err;
        });

        // Register user
        return await cluster.execute(null, async ({ page }) => {
            const user = {
                email,
                password,
            };

            // user
            await init.registerUser(user, page);
            await init.addMonitorToComponent(componentName, monitorName, page);
        });
    });

    afterAll(async () => {
        await cluster.idle();
        await cluster.close();
    });

    test(
        'Should navigate to monitor details and create new subscriber from a csv file',
        async () => {
            return await cluster.execute(null, async ({ page }) => {
                // Navigate to Monitor details
                await init.navigateToMonitorDetails(
                    componentName,
                    monitorName,
                    page
                );

                // click on subscribers tab
                await page.waitForSelector('#react-tabs-2');
                await page.click('#react-tabs-2');

                const importFileSelector = '#importFromCsv';
                await page.waitForSelector(importFileSelector);
                await page.click(importFileSelector);

                await page.waitForSelector('#fileInput', { visible: true });
                const input = await page.$('#fileInput');
                await input.uploadFile(csvFile);
                await input.evaluate(upload =>
                    upload.dispatchEvent(new Event('change', { bubbles: true }))
                );
                await page.click('#importCsvButton');
                await page.waitForSelector('#importCsvButton', {
                    hidden: true,
                });

                const createdSubscriberSelector = '.subscriber-list-item';

                await page.waitForSelector(createdSubscriberSelector);
                const subscriberRows = await page.$$(createdSubscriberSelector);
                const countSubscribers = subscriberRows.length;
                expect(countSubscribers).toEqual(3);
            });
        },
        operationTimeOut
    );

    test(
        'Should not create subscribers when an empty file is submitted',
        async () => {
            return await cluster.execute(null, async ({ page }) => {
                // Navigate to Monitor details
                await init.navigateToMonitorDetails(
                    componentName,
                    monitorName,
                    page
                );
                // click on subscribers tab
                await page.waitForSelector('#react-tabs-2');
                await page.click('#react-tabs-2');
                const importFileSelector = '#importFromCsv';
                await page.waitForSelector(importFileSelector);
                await page.click(importFileSelector);

                await page.waitForSelector('#fileInput', { visible: true });
                const input = await page.$('#fileInput');
                await input.uploadFile(emptyFile);
                await input.evaluate(upload =>
                    upload.dispatchEvent(new Event('change', { bubbles: true }))
                );
                await page.click('#importCsvButton');
                let elementHandle;
                elementHandle = await page.waitForSelector('span#errorMsg');
                elementHandle = await elementHandle.getProperty('innerText');
                elementHandle = await elementHandle.jsonValue();
                elementHandle.should.be.exactly('Empty files submitted');
            });
        },
        operationTimeOut
    );

    test(
        'Should not subscribe if subscriber has already been subscribed to that monitor',
        async () => {
            return await cluster.execute(null, async ({ page }) => {
                // Navigate to Monitor details
                await init.navigateToMonitorDetails(
                    componentName,
                    monitorName,
                    page
                );
                // click on subscribers tab
                await page.waitForSelector('#react-tabs-2');
                await page.click('#react-tabs-2');
                const importFileSelector = '#importFromCsv';
                await page.waitForSelector(importFileSelector);
                await page.click(importFileSelector);

                await page.waitForSelector('#fileInput', { visible: true });
                const input = await page.$('#fileInput');
                await input.uploadFile(csvFile);
                await input.evaluate(upload =>
                    upload.dispatchEvent(new Event('change', { bubbles: true }))
                );
                await page.click('#importCsvButton');
                await page.waitForSelector('#importCsvButton', {
                    hidden: true,
                });
                const createdSubscriberSelector = '.subscriber-list-item';

                await page.waitForSelector(createdSubscriberSelector);
                const subscriberRows = await page.$$(createdSubscriberSelector);
                const countSubscribers = subscriberRows.length;
                expect(countSubscribers).toEqual(3);
            });
        },
        operationTimeOut
    );

    test(
        'Should ignore exisiting subscribers and only add new ones',
        async () => {
            return await cluster.execute(null, async ({ page }) => {
                // Navigate to Monitor details
                await init.navigateToMonitorDetails(
                    componentName,
                    monitorName,
                    page
                );
                // click on subscribers tab
                await page.waitForSelector('#react-tabs-2');
                await page.click('#react-tabs-2');
                const importFileSelector = '#importFromCsv';
                await page.waitForSelector(importFileSelector);
                await page.click(importFileSelector);

                await page.waitForSelector('#fileInput', { visible: true });
                const input = await page.$('#fileInput');
                await input.uploadFile(existingSubscribers);
                await input.evaluate(upload =>
                    upload.dispatchEvent(new Event('change', { bubbles: true }))
                );
                await page.click('#importCsvButton');
                await page.waitForSelector('#importCsvButton', {
                    hidden: true,
                });
                const createdSubscriberSelector = '.subscriber-list-item';

                await page.waitForSelector(createdSubscriberSelector);
                const subscriberRows = await page.$$(createdSubscriberSelector);
                const countSubscribers = subscriberRows.length;
                expect(countSubscribers).toEqual(4);
            });
        },
        operationTimeOut
    );

    test(
        'Should delete a subscriber',
        async () => {
            return await cluster.execute(null, async ({ page }) => {
                // Navigate to Monitor details
                await init.navigateToMonitorDetails(
                    componentName,
                    monitorName,
                    page
                );
                // click on subscribers tab
                await page.waitForSelector('#react-tabs-2');
                await page.click('#react-tabs-2');

                let initialSubscribers = '.subscriber-list-item';

                await page.waitForSelector(initialSubscribers);
                initialSubscribers = await page.$$(initialSubscribers);
                const initialCount = initialSubscribers.length;

                await page.waitForSelector('button[id=deleteSubscriber_0]');
                await page.click('button[id=deleteSubscriber_0]');
                await page.waitForSelector('#deleteSubscriber');
                await page.click('#deleteSubscriber');
                await page.waitForSelector('#deleteSubscriber', {
                    hidden: true,
                });
                await page.waitForSelector('#subscribersList');

                let finalSubscribers = '.subscriber-list-item';

                await page.waitForSelector(finalSubscribers);
                finalSubscribers = await page.$$(finalSubscribers);
                const finalCount = finalSubscribers.length;

                expect(finalCount).toEqual(3);
                expect(initialCount).toBeGreaterThan(finalCount);
            });
        },
        operationTimeOut
    );

    test(
        'Should not delete a subscriber when the cancel button is clicked',
        async () => {
            return await cluster.execute(null, async ({ page }) => {
                // Navigate to Monitor details
                await init.navigateToMonitorDetails(
                    componentName,
                    monitorName,
                    page
                );
                // click on subscribers tab
                await page.waitForSelector('#react-tabs-2');
                await page.click('#react-tabs-2');

                let initialSubscribers = '.subscriber-list-item';

                await page.waitForSelector(initialSubscribers);
                initialSubscribers = await page.$$(initialSubscribers);
                const initialCount = initialSubscribers.length;

                await page.waitForSelector('button[id=deleteSubscriber_0]');
                await page.click('button[id=deleteSubscriber_0]');
                await page.waitForSelector('#cancelDeleteSubscriber');
                await page.click('#cancelDeleteSubscriber');
                await page.waitForSelector('#subscribersList');

                let finalSubscribers = '.subscriber-list-item';

                await page.waitForSelector(finalSubscribers);
                finalSubscribers = await page.$$(finalSubscribers);
                const finalCount = finalSubscribers.length;

                expect(finalCount).toEqual(3);
                expect(initialCount).toEqual(finalCount);
            });
        },
        operationTimeOut
    );
});
