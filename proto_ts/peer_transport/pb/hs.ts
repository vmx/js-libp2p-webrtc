// @generated by protobuf-ts 2.8.2
// @generated from protobuf file "peer_transport/pb/hs.proto" (package "webrtc_peer.pb", syntax proto2)
// tslint:disable
import type { BinaryWriteOptions } from "@protobuf-ts/runtime";
import type { IBinaryWriter } from "@protobuf-ts/runtime";
import { WireType } from "@protobuf-ts/runtime";
import type { BinaryReadOptions } from "@protobuf-ts/runtime";
import type { IBinaryReader } from "@protobuf-ts/runtime";
import { UnknownFieldHandler } from "@protobuf-ts/runtime";
import type { PartialMessage } from "@protobuf-ts/runtime";
import { reflectionMergePartial } from "@protobuf-ts/runtime";
import { MESSAGE_TYPE } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
/**
 * @generated from protobuf message webrtc_peer.pb.Message
 */
export interface Message {
    /**
     * @generated from protobuf field: webrtc_peer.pb.Message.MessageType type = 1;
     */
    type: Message_MessageType;
    /**
     * @generated from protobuf field: string data = 2;
     */
    data: string;
}
/**
 * @generated from protobuf enum webrtc_peer.pb.Message.MessageType
 */
export enum Message_MessageType {
    /**
     * @generated from protobuf enum value: OFFER = 0;
     */
    OFFER = 0,
    /**
     * @generated from protobuf enum value: ANSWER = 1;
     */
    ANSWER = 1,
    /**
     * @generated from protobuf enum value: CANDIDATE = 2;
     */
    CANDIDATE = 2
}
// @generated message type with reflection information, may provide speed optimized methods
class Message$Type extends MessageType<Message> {
    constructor() {
        super("webrtc_peer.pb.Message", [
            { no: 1, name: "type", kind: "enum", T: () => ["webrtc_peer.pb.Message.MessageType", Message_MessageType] },
            { no: 2, name: "data", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<Message>): Message {
        const message = { type: 0, data: "" };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<Message>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: Message): Message {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* webrtc_peer.pb.Message.MessageType type */ 1:
                    message.type = reader.int32();
                    break;
                case /* string data */ 2:
                    message.data = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: Message, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* webrtc_peer.pb.Message.MessageType type = 1; */
        if (message.type !== 0)
            writer.tag(1, WireType.Varint).int32(message.type);
        /* string data = 2; */
        if (message.data !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.data);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message webrtc_peer.pb.Message
 */
export const Message = new Message$Type();
