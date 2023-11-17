package socket;

import com.google.gson.JsonObject;

import java.lang.reflect.Method;

interface SocketEventHandler {
    void run(Socket socket, JsonObject data);

    static boolean isValidEventHandler(Method method) {
        Class<?>[] types = method.getParameterTypes();
        if (types.length != 2) return false;
        Class<?> param1 = types[0], param2 = types[1];
        return param1.isAssignableFrom(Socket.class) && param2.isAssignableFrom(JsonObject.class);
    }
}
