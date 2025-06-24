import assert from "assert";

import { IosManager, IosRobot } from "../src/ios";

describe("ios", async () => {

	const manager = new IosManager();
	const devices = await manager.listDevices();
	const hasOneDevice = devices.length === 1;
	const robot = new IosRobot(devices?.[0]?.deviceId || "");

	it("should be able to get screenshot", async function() {
		hasOneDevice || this.skip();
		const screenshot = await robot.getScreenshot();
		assert.ok(screenshot.length > 64 * 1024);
	});

	it("should be able to get current orientation", async function() {
		hasOneDevice || this.skip();
		const orientation = await robot.getOrientation();
		assert.ok(orientation === "portrait" || orientation === "landscape", `Expected portrait or landscape, got ${orientation}`);
	});

	it("should be able to set orientation to portrait", async function() {
		hasOneDevice || this.skip();
		await robot.setOrientation("portrait");
		await new Promise(resolve => setTimeout(resolve, 3000)); // Wait longer for physical device
		const orientation = await robot.getOrientation();
		assert.equal(orientation, "portrait", "Device should be in portrait orientation");
	});

	it("should be able to set orientation to landscape", async function() {
		hasOneDevice || this.skip();
		await robot.setOrientation("landscape");
		await new Promise(resolve => setTimeout(resolve, 3000)); // Wait longer for physical device
		const orientation = await robot.getOrientation();
		assert.equal(orientation, "landscape", "Device should be in landscape orientation");
	});

	it("should be able to switch between orientations", async function() {
		hasOneDevice || this.skip();

		await robot.setOrientation("portrait");
		await new Promise(resolve => setTimeout(resolve, 3000));
		let orientation = await robot.getOrientation();
		assert.equal(orientation, "portrait", "Device should be in portrait orientation");

		await robot.setOrientation("landscape");
		await new Promise(resolve => setTimeout(resolve, 3000));
		orientation = await robot.getOrientation();
		assert.equal(orientation, "landscape", "Device should be in landscape orientation");

		await robot.setOrientation("portrait");
		await new Promise(resolve => setTimeout(resolve, 3000));
		orientation = await robot.getOrientation();
		assert.equal(orientation, "portrait", "Device should be back in portrait orientation");
	});
});
