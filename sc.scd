OSCdef.new(
    \interpret,
    { |msg| thisProcess.interpreter.interpret(msg[1].asString); },
    '/interpret'
);
"OSC receiver for '/interpret' is ready.".postln;

// SuperColliderコード
~nodeAddr = NetAddr("127.0.0.1", 57121); // Node.jsのポートに合わせる

~sendErrorToNode = { arg message;
    ~nodeAddr.sendMsg("/sc/error", message);
    message.error; // sclangのPost Windowにもエラーとして表示する
};

~sendLogToNode = { arg message;
    ~nodeAddr.sendMsg("/sc/log", message.asString);
    message.postln; // sclangのPost Windowにも表示
};

"Custom OSC Sender defined. Try calling ~sendErrorToNode(\"Test Error!\");".postln;




