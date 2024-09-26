import { randomInt } from 'crypto'
import AbstractSpruceTest, {
    assert,
    generateId,
    test,
} from '@sprucelabs/test-utils'
import {
    FakeLiblsl,
    generateRandomOutletOptions,
    LiblslImpl,
    LslOutletOptions,
} from '@neurodevs/node-lsl'
import EventMarkerLslOutlet from '../../EventMarkerLslOutlet'
import SpyEventMarkerLslOutlet from '../../testDoubles/SpyEventMarkerLslOutlet'

export default class EventMarkerLslOutletTest extends AbstractSpruceTest {
    private static fakeLiblsl: FakeLiblsl
    private static outlet: SpyEventMarkerLslOutlet

    protected static async beforeEach() {
        await super.beforeEach()
        EventMarkerLslOutlet.Class = SpyEventMarkerLslOutlet
        this.fakeLiblsl = new FakeLiblsl()
        LiblslImpl.setInstance(this.fakeLiblsl)
        this.outlet = this.Outlet()
    }

    @test()
    protected static async loadsWithEventMarkerSpecificOptions() {
        assert.isEqualDeep(this.outlet.passedOptions, {
            name: 'Event markers',
            type: 'Markers',
            channelNames: ['Markers'],
            sampleRate: 0,
            channelFormat: 'string',
            sourceId: 'event-markers',
            manufacturer: 'N/A',
            unit: 'N/A',
            chunkSize: 0,
            maxBuffered: 0,
        })
    }

    @test()
    protected static async canOverrideDefaultOptions() {
        const options = generateRandomOutletOptions()
        const outlet = this.Outlet(options)
        assert.isEqualDeep(outlet.passedOptions, options)
    }

    @test()
    protected static async pushingSingleMarkerIncrementsHitCountAndWaitTime() {
        const markers = [this.generateDurationMarkerValues()]
        await this.outlet.pushMarkers(markers)

        assert.isEqual(this.fakeLiblsl.pushSampleStringTimestampHitCount, 1)
        assert.isEqual(this.outlet.totalWaitTimeMs, markers[0].durationMs)
    }

    @test()
    protected static async pushingTwoMarkersIncrementsHitCountAndWaitTimeTwice() {
        const markers = await this.pushTotalMarkers(2)

        assert.isEqual(this.fakeLiblsl.pushSampleStringTimestampHitCount, 2)
        assert.isEqual(
            this.outlet.totalWaitTimeMs,
            markers[0].durationMs + markers[1].durationMs
        )
    }

    @test('can stop on the first marker', 1)
    @test('can stop on the second marker', 2)
    @test('can stop on the third marker', 3)
    protected static async canStopEventMarkersMidPush(bailIdx: number) {
        let hitCount = 0

        this.outlet.pushSample = () => {
            hitCount += 1
            if (hitCount === bailIdx) {
                this.outlet.stop()
            }
        }

        await this.pushTotalMarkers(10)

        assert.isEqual(hitCount, bailIdx)
    }

    @test()
    protected static async canStartAgainAfterStopping() {
        this.outlet.stop()

        let hitCount = 0

        this.outlet.pushSample = () => {
            hitCount++
        }

        await this.pushTotalMarkers(10)

        assert.isEqual(hitCount, 10)
    }

    @test()
    protected static async doesNotWaitIfStopped() {
        this.setupOutlet()

        const startMs = Date.now()
        const promise = this.pushTotalMarkers(2, 1000)
        this.outlet.stop()
        await promise
        const endMs = Date.now()

        assert.isBelow(endMs - startMs, 10)
    }

    @test()
    protected static async clearsTheTimeoutOnStop() {
        this.setupOutlet()

        const promise = this.pushTotalMarkers(2, 100)

        this.outlet.stop()
        this.outlet.pushSample = () =>
            assert.fail('Should not have been called')

        await promise
        await this.wait(100)
    }

    private static setupOutlet() {
        EventMarkerLslOutlet.Class = EventMarkerLslOutlet as any
        this.outlet = this.Outlet()
    }

    private static async pushTotalMarkers(total: number, durationMs?: number) {
        const markers = new Array(total)
            .fill(null)
            .map(() => this.generateDurationMarkerValues(durationMs))

        await this.outlet.pushMarkers(markers)

        return markers
    }

    private static generateDurationMarkerValues(durationMs?: number) {
        return {
            name: generateId(),
            durationMs: durationMs ?? randomInt(100, 1000),
        }
    }

    private static Outlet(options?: Partial<LslOutletOptions>) {
        return EventMarkerLslOutlet.Create(options) as SpyEventMarkerLslOutlet
    }
}
