import { LslOutletOptions } from '@neurodevs/node-lsl'
import EventMarkerLslOutlet from '../EventMarkerLslOutlet'

export default class SpyEventMarkerLslOutlet extends EventMarkerLslOutlet {
    public passedOptions: LslOutletOptions
    public totalWaitTimeMs: number

    public constructor(options: LslOutletOptions) {
        super(options)
        this.passedOptions = options
        this.totalWaitTimeMs = 0
    }

    public async wait(durationMs: number) {
        this.totalWaitTimeMs += durationMs
        return Promise.resolve()
    }
}
