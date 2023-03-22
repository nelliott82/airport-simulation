/*
Airport simulation with randomly generated airplanes entering airspace.

- Each plane has a randomly generated amount of fuel of at least 100 liters.
- Airport only has one runway and can only land one plane at a time.
- It takes 80 liters of fuel to land a plane safely.
- If a plane runs out of fuel before landing, it crashes.

First attempt had planes landing sufficiently, but still resulted in some crashes.

Without adding another runway, it is inevitable that some planes will crash.

I created a few variables and logic to halt a plane's current landing attempt and begin landing another IF the following conditions are true:
- The current landing plane has enough fuel (at least 81 liters + its current altitude) to wait for another plane to make its full landing attempt before starting to land again.
- The other plane being considered for reprioritization has less fuel than the current landing plane AND has enough fuel to make a safe landing.

I also built in a loop to run the simulation 1,000 times for up to 10,000 frames each time. Half of the simulations reprioritize landing planes (test group) and half of
them do not (control group). The total number of crashes each run are recorded in an object (crashTally) to compare the rates of crashes.

Future work to consider:
- Adding n more runways.
*/

// returns a Promise which resolves after `ms` milliseconds
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let crashTally = { controls: 0, tests: 0 }

function recordCrashes (control, airplanes) {
    let crashed = 0;

    airplanes.forEach((airplane) => {
        if (airplane.crashed) {
            crashed += 1;
        }
    })

    if (control) {
        crashTally.controls += crashed;
    } else {
        crashTally.tests += crashed;
    }
}

function log(frameNumber, message) {
    console.log(
        `\x1b[2m[Frame #${frameNumber.toString().padStart(4, '0')}] \x1b[0m` +
        message
    );
}

class Airplane {
    constructor(planeNumber) {
        this.planeNumber = planeNumber;
        this.fuel = Math.floor(Math.random() * 900) + 100;  // liters
        this.fuelRate = 1;  // liters / frame tick
        this.crashed = false;
        this.altitude = 80;
        this.landing = false;
        this.landed = false;
    }

    tick(frameNumber) {
        if (!this.crashed) {
            this.fuel -= this.fuelRate;

            if (this.landing) {
                this.handleLanding();
            } else {
                this.handleCrash();
            }
        }
    }

    handleLanding() {
        this.altitude -= this.fuelRate;
        if (!this.altitude) {
            this.landing = false;
            this.landed = true;
            //log(frameNumber, `Plane ${this.planeNumber} landed with ${this.fuel} liters of fuel left.`)
        }
    }

    handleCrash() {
        if (this.fuel <= 0) {
            this.crashed = true;
            //log(frameNumber, `☠️  Plane ${this.planeNumber} crashed`);
        }
    }
}

class Simulation {
    constructor(runNumber, control) {
        this.airplanes = [];
        this.frameNumber = 0;
        this.framerate = 60;
        this.runNumber = runNumber;
        this.control = control;
    }

    async run() {
        while (this.frameNumber < 10000) {
            this.tick();
            //await sleep(1000 / this.framerate);
        }

        recordCrashes(this.control, this.airplanes);

        if (this.runNumber === 100) {
            console.log(crashTally)
        }
    }

    tick() {
        this.frameNumber += 1;
        let planeLanding = false;
        let landingPlane = {};
        let lowestAirplane = { fuel: Infinity };

        this.generateAirplane();

        this.airplanes.forEach((airplane) => {
            if (!airplane.landed) {
                airplane.tick(this.frameNumber);
            }
            if (airplane.landing) {
                landingPlane = airplane;
                planeLanding = true;
            }
            if (airplane.fuel < lowestAirplane.fuel &&
                    airplane.fuel >= 80 &&
                    !airplane.landed) {
                lowestAirplane = airplane;
            }
        });

        this.startPlaneLanding(planeLanding, lowestAirplane);

        if (landingPlane.planeNumber && !this.control) {
            this.prioritizeLandingOtherPlane(lowestAirplane, landingPlane);
        }
    }

    generateAirplane() {
        if (Math.floor(Math.random() * 100) == 0) {
            const nextPlaneNumber = this.airplanes.length + 1;
            const newAirplane = new Airplane(nextPlaneNumber);
            /*log(
                this.frameNumber,
                `Plane ${newAirplane.planeNumber} entered airspace with ` +
                `${newAirplane.fuel} liters of fuel`
            );*/
            this.airplanes.push(newAirplane);
        }
    }

    startPlaneLanding(planeLanding, lowestAirplane) {
        if (!planeLanding &&
                this.airplanes.length &&
                lowestAirplane.planeNumber) {
            lowestAirplane.landing = true;

            //log(this.frameNumber, `Plane ${lowestAirplane.planeNumber} is landing.`);
        }
    }

    prioritizeLandingOtherPlane(lowestAirplane, landingPlane) {
        if (lowestAirplane.fuel < landingPlane.fuel &&
                landingPlane.fuel >= (81 + landingPlane.altitude)) {
            landingPlane.landing = false;
            //log(this.frameNumber, `Plane ${landingPlane.planeNumber} landing has been halted.`);
            lowestAirplane.landing = true;
            //log(this.frameNumber, `Plane ${lowestAirplane.planeNumber} is landing.`);
        }
    }
}

console.log("running Simulation");
for (let i = 1; i <= 1000; i++) {
    let s = new Simulation(i, i % 2 === 0);
    s.run();
}