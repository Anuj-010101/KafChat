import { useState } from "react";
import { FiLock } from "react-icons/fi";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

const DecoyCalculator = ({ onUnlock }) => {
  const { user } = useAuth();
  const [display, setDisplay] = useState("0");
  const [prevVal, setPrevVal] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  // Number input
  const inputDigit = (digit) => {
    if (waitingForOperand) {
      setDisplay(String(digit));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? String(digit) : display + digit);
    }
  };

  // Decimal point
  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  // Clear
  const clearDisplay = () => {
    setDisplay("0");
    setPrevVal(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  // Operators
  const performOperation = (nextOperator) => {
    const inputValue = parseFloat(display);

    if (prevVal === null) {
      setPrevVal(inputValue);
    } else if (operator) {
      const currentValue = prevVal || 0;
      let newValue = currentValue;

      if (operator === "+") newValue = currentValue + inputValue;
      else if (operator === "-") newValue = currentValue - inputValue;
      else if (operator === "×") newValue = currentValue * inputValue;
      else if (operator === "÷") newValue = inputValue !== 0 ? currentValue / inputValue : "Error";

      setPrevVal(newValue);
      setDisplay(String(newValue));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  // Equals (=) handler - Checks secret PIN vs normal calculation
  const handleEquals = async () => {
    const enteredPin = display.trim();

    // 1. PIN verification check
    try {
      const { data } = await api.post("/devices/verify-decoy-pin", { pin: enteredPin });
      if (data.unlocked) {
        toast.success("Decoy PIN Verified. Unlocking KafChat! 🔓", { icon: "⚡" });
        sessionStorage.setItem("kafchat_decoy_unlocked", "true");
        if (onUnlock) onUnlock();
        return;
      }
    } catch {
      // If PIN is invalid, continue with standard calculation
    }

    // 2. Normal math calculation
    const inputValue = parseFloat(display);
    if (operator && prevVal !== null) {
      let result = prevVal;
      if (operator === "+") result = prevVal + inputValue;
      else if (operator === "-") result = prevVal - inputValue;
      else if (operator === "×") result = prevVal * inputValue;
      else if (operator === "÷") result = inputValue !== 0 ? prevVal / inputValue : "Error";

      setDisplay(String(result));
      setPrevVal(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#080b11] flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xs bg-[#0d131f] border border-slate-800 rounded-[36px] p-6 shadow-2xl flex flex-col gap-5">
        {/* Top Header */}
        <div className="flex items-center justify-between text-slate-500 px-1">
          <span className="text-xs font-mono tracking-wider">CALCULATOR</span>
          <FiLock size={13} className="text-slate-600" />
        </div>

        {/* Display Screen */}
        <div className="w-full h-20 bg-[#121929] border border-slate-800 rounded-2xl p-4 flex flex-col justify-end items-end overflow-hidden shadow-inner">
          <span className="text-3xl font-mono font-bold text-white tracking-wider truncate max-w-full">
            {display}
          </span>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-4 gap-2.5">
          {/* Row 1 */}
          <button
            type="button"
            onClick={clearDisplay}
            className="h-14 rounded-2xl bg-slate-800 text-pink-400 font-bold text-base hover:bg-slate-700 transition"
          >
            AC
          </button>
          <button
            type="button"
            onClick={() => setDisplay(String(parseFloat(display) * -1))}
            className="h-14 rounded-2xl bg-slate-800 text-slate-300 font-bold text-base hover:bg-slate-700 transition"
          >
            ±
          </button>
          <button
            type="button"
            onClick={() => setDisplay(String(parseFloat(display) / 100))}
            className="h-14 rounded-2xl bg-slate-800 text-slate-300 font-bold text-base hover:bg-slate-700 transition"
          >
            %
          </button>
          <button
            type="button"
            onClick={() => performOperation("÷")}
            className="h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 font-bold text-xl hover:bg-cyan-500 hover:text-black transition"
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            type="button"
            onClick={() => inputDigit(7)}
            className="h-14 rounded-2xl bg-[#121929] text-white font-bold text-lg hover:bg-slate-800 transition"
          >
            7
          </button>
          <button
            type="button"
            onClick={() => inputDigit(8)}
            className="h-14 rounded-2xl bg-[#121929] text-white font-bold text-lg hover:bg-slate-800 transition"
          >
            8
          </button>
          <button
            type="button"
            onClick={() => inputDigit(9)}
            className="h-14 rounded-2xl bg-[#121929] text-white font-bold text-lg hover:bg-slate-800 transition"
          >
            9
          </button>
          <button
            type="button"
            onClick={() => performOperation("×")}
            className="h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 font-bold text-xl hover:bg-cyan-500 hover:text-black transition"
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            type="button"
            onClick={() => inputDigit(4)}
            className="h-14 rounded-2xl bg-[#121929] text-white font-bold text-lg hover:bg-slate-800 transition"
          >
            4
          </button>
          <button
            type="button"
            onClick={() => inputDigit(5)}
            className="h-14 rounded-2xl bg-[#121929] text-white font-bold text-lg hover:bg-slate-800 transition"
          >
            5
          </button>
          <button
            type="button"
            onClick={() => inputDigit(6)}
            className="h-14 rounded-2xl bg-[#121929] text-white font-bold text-lg hover:bg-slate-800 transition"
          >
            6
          </button>
          <button
            type="button"
            onClick={() => performOperation("-")}
            className="h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 font-bold text-xl hover:bg-cyan-500 hover:text-black transition"
          >
            -
          </button>

          {/* Row 4 */}
          <button
            type="button"
            onClick={() => inputDigit(1)}
            className="h-14 rounded-2xl bg-[#121929] text-white font-bold text-lg hover:bg-slate-800 transition"
          >
            1
          </button>
          <button
            type="button"
            onClick={() => inputDigit(2)}
            className="h-14 rounded-2xl bg-[#121929] text-white font-bold text-lg hover:bg-slate-800 transition"
          >
            2
          </button>
          <button
            type="button"
            onClick={() => inputDigit(3)}
            className="h-14 rounded-2xl bg-[#121929] text-white font-bold text-lg hover:bg-slate-800 transition"
          >
            3
          </button>
          <button
            type="button"
            onClick={() => performOperation("+")}
            className="h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 font-bold text-xl hover:bg-cyan-500 hover:text-black transition"
          >
            +
          </button>

          {/* Row 5 */}
          <button
            type="button"
            onClick={() => inputDigit(0)}
            className="col-span-2 h-14 rounded-2xl bg-[#121929] text-white font-bold text-lg hover:bg-slate-800 transition pl-6 text-left"
          >
            0
          </button>
          <button
            type="button"
            onClick={inputDot}
            className="h-14 rounded-2xl bg-[#121929] text-white font-bold text-lg hover:bg-slate-800 transition"
          >
            .
          </button>
          <button
            type="button"
            onClick={handleEquals}
            className="h-14 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black text-2xl hover:opacity-95 shadow-lg shadow-cyan-500/20 transition"
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
};

export default DecoyCalculator;