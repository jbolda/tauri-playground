import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";

import {
  createCheckpoints,
  createRelationships,
  createStore,
} from "tinybase/lib/tinybase";
import { StoreInspector } from "tinybase/lib/ui-react-dom";
import { createLocalPersister } from "tinybase/lib/persisters/persister-browser";
import {
  LinkedRowsView,
  Provider,
  useAddRowCallback,
  useCell,
  useCreateCheckpoints,
  useCreatePersister,
  useCreateRelationships,
  useCreateStore,
  useLinkedRowIds,
  useLocalRowIds,
  useRedoInformation,
  useRemoteRowId,
  useRow,
  useRowListener,
  useSetCellCallback,
  useSetCheckpointCallback,
  useSetPartialRowCallback,
  useStore,
  useUndoInformation,
} from "tinybase/lib/ui-react";

const useDraggableObject = (
  getInitial,
  onDrag,
  onDragStart = null,
  onDragStop = null
) => {
  const [start, setStart] = useState();

  const handleMouseDown = useCallback(
    (event) => {
      onDragStart?.();
      setStart({
        x: event.clientX,
        y: event.clientY,
        initial: getInitial(),
      });
      event.stopPropagation();
    },
    [getInitial, onDragStart]
  );
  const handleMouseMove = useCallback(
    (event) => {
      if (start != null) {
        onDrag({
          dx: event.clientX - start.x,
          dy: event.clientY - start.y,
          initial: start.initial,
        });
      }
      event.stopPropagation();
    },
    [onDrag, start]
  );
  const handleMouseUp = useCallback(
    (event) => {
      setStart(null);
      onDragStop?.();
      event.stopPropagation();
    },
    [onDragStop]
  );

  const ref = useRef(null);
  useLayoutEffect(() => {
    const { current } = ref;
    current.addEventListener("mousedown", handleMouseDown);
    return () => current.removeEventListener("mousedown", handleMouseDown);
  }, [ref, handleMouseDown]);
  useEffect(() => {
    if (start != null) {
      addEventListener("mousemove", handleMouseMove);
      addEventListener("mouseup", handleMouseUp);
      return () => {
        removeEventListener("mousemove", handleMouseMove);
        removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [start, handleMouseMove, handleMouseUp]);

  return ref;
};

const SHAPES = "shapes";
const CANVAS_ID = "0";
const MIN_WIDTH = 50;
const MIN_HEIGHT = 30;
const TYPES = ["rectangle", "ellipse"];

const constrainType = (store, tableId, rowId, cellId, type) => {
  if (type != null && !TYPES.includes(type)) {
    store.setCell(tableId, rowId, cellId, TYPES[0]);
  }
};

const constrainColor = (store, tableId, rowId, cellId, color) => {
  if (color != null && !/^#[a-f\d]{6}$/.test(color)) {
    store.setCell(tableId, rowId, cellId, "#000000");
  }
};

const SelectedIdContext = createContext([null, () => {}]);
const useSelectedIdState = () => useContext(SelectedIdContext);

const App = () => {
  const store = useCreateStore(() => {
    const store = createStore().setTablesSchema({
      [SHAPES]: {
        x1: { type: "number", default: 100 },
        y1: { type: "number", default: 100 },
        x2: { type: "number", default: 300 },
        y2: { type: "number", default: 200 },
        text: { type: "string", default: "text" },
        type: { type: "string" },
        backColor: { type: "string", default: "#0077aa" },
        textColor: { type: "string", default: "#ffffff" },
        nextId: { type: "string" },
      },
    });
    store.addCellListener(SHAPES, null, "type", constrainType, true);
    store.addCellListener(SHAPES, null, "backColor", constrainColor, true);
    store.addCellListener(SHAPES, null, "textColor", constrainColor, true);
    return store;
  }, []);
  // ...

  // ...
  const checkpoints = useCreateCheckpoints(store, createCheckpoints);

  useCreatePersister(
    store,
    (store) => createLocalPersister(store, "drawing/store"),
    [],
    async (persister) => {
      await persister.startAutoLoad({
        shapes: {
          [CANVAS_ID]: { x1: 0, y1: 0, nextId: "1", text: "[canvas]" },
          1: {},
        },
      });
      checkpoints.clear();
      await persister.startAutoSave();
    },
    [checkpoints]
  );

  const relationships = useCreateRelationships(store, (store) =>
    createRelationships(store).setRelationshipDefinition(
      "order",
      SHAPES,
      SHAPES,
      "nextId"
    )
  );
  // ...

  // ...
  return (
    <Provider
      store={store}
      relationships={relationships}
      checkpoints={checkpoints}
    >
      <SelectedIdContext.Provider value={useState()}>
        <Toolbar />
        <Canvas />
        <Sidebar />
      </SelectedIdContext.Provider>
      <StoreInspector />
    </Provider>
  );
};
export default App;

const Toolbar = () => {
  const [useSelectedId] = useSelectedIdState();
  return (
    <div id="toolbar">
      <UndoRedo />
      <ShapeAdd />
      {useSelectedId == null ? null : (
        <>
          <ShapeOrder />
          <ShapeDelete />
        </>
      )}
    </div>
  );
};

const UndoRedo = () => {
  const [canUndo, handleUndo, , undoLabel] = useUndoInformation();
  const [canRedo, handleRedo, , redoLabel] = useRedoInformation();

  return (
    <>
      <div
        className={`button undo${canUndo ? "" : " disabled"}`}
        {...(canUndo
          ? { onClick: handleUndo, title: `Undo ${undoLabel}` }
          : {})}
      />
      <div
        className={`button redo${canRedo ? "" : " disabled"}`}
        {...(canRedo
          ? { onClick: handleRedo, title: `Redo ${redoLabel}` }
          : {})}
      />
    </>
  );
};

const ShapeAdd = () => {
  const frontId = useFrontId();
  const [, setSelectedId] = useSelectedIdState();
  const setCheckpoint = useSetCheckpointCallback(() => "add shape", []);
  const onAddRow = useCallback(
    (id, store) => {
      store.setCell(SHAPES, frontId, "nextId", id);
      setSelectedId(id);
      setCheckpoint();
    },
    [frontId, setSelectedId, setCheckpoint]
  );
  const handleClick = useAddRowCallback(
    SHAPES,
    () => ({}),
    [],
    null,
    onAddRow,
    [onAddRow]
  );
  return (
    <div className="button add" onClick={handleClick}>
      Add shape
    </div>
  );
};

const useBackId = () => useLinkedRowIds("order", CANVAS_ID)[1];
const useFrontId = () => useLinkedRowIds("order", CANVAS_ID).slice(-1)[0];

const ShapeOrder = () => {
  const [selectedId] = useSelectedIdState();
  const frontId = useFrontId();
  const forwardId = useRemoteRowId("order", selectedId);
  const [previousId] = useLocalRowIds("order", selectedId);
  const [backwardId] = useLocalRowIds("order", previousId);
  const backId = useBackId();
  return [
    ["front", "To front", frontId, useOrderShape(frontId, "to front")],
    ["forward", "Forward", frontId, useOrderShape(forwardId, "forward")],
    ["backward", "Backward", backId, useOrderShape(backwardId, "backward")],
    ["back", "To back", backId, useOrderShape(CANVAS_ID, "to back")],
  ].map(([className, label, disabledIfId, handleClick]) => {
    const disabled = selectedId == null || selectedId == disabledIfId;
    return (
      <div
        className={`button ${className} ${disabled ? " disabled" : ""}`}
        onClick={disabled ? null : handleClick}
        key={className}
      >
        {label}
      </div>
    );
  });
};

const useOrderShape = (toId, label) => {
  const store = useStore();
  const [selectedId] = useSelectedIdState();
  const [previousId] = useLocalRowIds("order", selectedId);
  const nextId = useRemoteRowId("order", selectedId);
  const nextNextId = useRemoteRowId("order", toId);
  const setCheckpoint = useSetCheckpointCallback(() => `move ${label}`, []);
  return useCallback(() => {
    store.transaction(() => {
      if (nextId != null) {
        store.setCell(SHAPES, previousId, "nextId", nextId);
      } else {
        store.delCell(SHAPES, previousId, "nextId");
      }
      if (nextNextId != null) {
        store.setCell(SHAPES, selectedId, "nextId", nextNextId);
      } else {
        store.delCell(SHAPES, selectedId, "nextId");
      }
      store.setCell(SHAPES, toId, "nextId", selectedId);
    });
    setCheckpoint();
  }, [selectedId, toId, store, previousId, nextId, nextNextId, setCheckpoint]);
};

const ShapeDelete = () => {
  const store = useStore();
  const [selectedId, setSelectedId] = useSelectedIdState();
  const [previousId] = useLocalRowIds("order", selectedId);
  const nextId = useRemoteRowId("order", selectedId);
  const setCheckpoint = useSetCheckpointCallback(() => "delete", []);
  const handleClick = useCallback(() => {
    store.transaction(() => {
      if (nextId == null) {
        store.delCell(SHAPES, previousId, "nextId");
      } else {
        store.setCell(SHAPES, previousId, "nextId", nextId);
      }
      store.delRow(SHAPES, selectedId);
    });
    setCheckpoint();
    setSelectedId();
  }, [store, selectedId, setSelectedId, previousId, nextId, setCheckpoint]);
  return (
    <div className="button delete" onClick={handleClick}>
      Delete
    </div>
  );
};

const Sidebar = () => {
  const [selectedId] = useSelectedIdState();
  return (
    <div id="sidebar">
      {selectedId == null ? null : (
        <>
          <SidebarTypeCell />
          <SidebarColorCell label="Text" cellId="textColor" />
          <SidebarColorCell label="Back" cellId="backColor" />
          <SidebarNumberCell label="Left" cellId="x1" />
          <SidebarNumberCell label="Top" cellId="y1" />
          <SidebarNumberCell label="Right" cellId="x2" />
          <SidebarNumberCell label="Bottom" cellId="y2" />
        </>
      )}
    </div>
  );
};

const SidebarCell = ({ label, children }) => (
  <div className="cell">
    {label}: {children}
  </div>
);

const SidebarTypeCell = () => {
  const [selectedId] = useSelectedIdState();
  const setCheckpoint = useSetCheckpointCallback(() => "change of type", []);
  return (
    <SidebarCell label="Shape">
      <select
        value={useCell(SHAPES, selectedId, "type")}
        onChange={useSetCellCallback(
          SHAPES,
          selectedId,
          "type",
          (e) => e.target.value,
          [],
          null,
          setCheckpoint
        )}
      >
        {TYPES.map((type) => (
          <option key={type}>{type}</option>
        ))}
      </select>
    </SidebarCell>
  );
};

const SidebarColorCell = ({ label, cellId }) => {
  const [selectedId] = useSelectedIdState();
  const setCheckpoint = useSetCheckpointCallback(
    () => `change of '${label.toLowerCase()}' color`,
    [label]
  );
  return (
    <SidebarCell label={label}>
      <input
        type="color"
        value={useCell(SHAPES, selectedId, cellId)}
        onChange={useSetCellCallback(
          SHAPES,
          selectedId,
          cellId,
          (e) => e.target.value,
          [],
          null,
          setCheckpoint
        )}
      />
    </SidebarCell>
  );
};

const nudgeUp = (cell) => cell + 1;
const nudgeDown = (cell) => cell - 1;

const SidebarNumberCell = ({ label, cellId }) => {
  const [selectedId] = useSelectedIdState();
  const setCheckpoint = useSetCheckpointCallback(
    () => `nudge of '${label.toLowerCase()}' value`,
    [label]
  );
  const handleDown = useSetCellCallback(
    SHAPES,
    selectedId,
    cellId,
    () => nudgeDown,
    [nudgeDown],
    null,
    setCheckpoint
  );
  const handleUp = useSetCellCallback(
    SHAPES,
    selectedId,
    cellId,
    () => nudgeUp,
    [nudgeUp],
    null,
    setCheckpoint
  );

  return (
    <SidebarCell label={label}>
      <div className="spin">
        <div className="button" onClick={handleDown}>
          -
        </div>
        {useCell(SHAPES, selectedId, cellId)}
        <div className="button" onClick={handleUp}>
          +
        </div>
      </div>{" "}
    </SidebarCell>
  );
};

const Canvas = () => {
  const ref = useRef(null);
  const store = useStore();

  const [canvasDimensions, setCanvasDimensions] = useState([0, 0]);

  const getShapeDimensions = useCallback(
    (id, maxX, maxY) => {
      const { x1, x2, y1, y2 } = store.getRow(SHAPES, id);
      const w = Math.max(x2 - x1, Math.min(MIN_WIDTH, maxX));
      const h = Math.max(y2 - y1, Math.min(MIN_HEIGHT, maxY));
      return { x1, x2, y1, y2, w, h };
    },
    [store]
  );

  useRowListener(
    SHAPES,
    null,
    (store, _tableId, rowId, getCellChange) => {
      const [maxX, maxY] = canvasDimensions;
      if (maxX == 0 || maxY == 0) {
        return;
      }

      const [x1Changed] = getCellChange(SHAPES, rowId, "x1");
      const [x2Changed] = getCellChange(SHAPES, rowId, "x2");
      const [y1Changed] = getCellChange(SHAPES, rowId, "y1");
      const [y2Changed] = getCellChange(SHAPES, rowId, "y2");
      if (
        (x1Changed || x2Changed || y1Changed || y2Changed) &&
        rowId != CANVAS_ID
      ) {
        const { x1, x2, y1, y2, w, h } = getShapeDimensions(rowId, maxX, maxY);
        if (x1Changed && x1 != null) {
          store.setCell(
            SHAPES,
            rowId,
            "x1",
            between(x1, 0, Math.min(x2, maxX) - w)
          );
        }
        if (x2Changed && x2 != null) {
          store.setCell(
            SHAPES,
            rowId,
            "x2",
            between(x2, Math.max(x1, 0) + w, maxX)
          );
        }
        if (y1Changed && y1 != null) {
          store.setCell(
            SHAPES,
            rowId,
            "y1",
            between(y1, 0, Math.min(y2, maxY) - h)
          );
        }
        if (y2Changed && y2 != null) {
          store.setCell(
            SHAPES,
            rowId,
            "y2",
            between(y2, Math.max(y1, 0) + h, maxY)
          );
        }
      }
    },
    [...canvasDimensions, getShapeDimensions],
    true
  );

  const updateDimensions = useCallback(
    (current) => {
      const { clientWidth: maxX, clientHeight: maxY } = current;
      setCanvasDimensions([maxX, maxY]);
      store.forEachRow(SHAPES, (id) => {
        if (id != CANVAS_ID) {
          const { x2, y2, w, h } = getShapeDimensions(id, maxX, maxY);
          if (x2 > maxX) {
            store.setPartialRow(SHAPES, id, {
              x1: Math.max(0, maxX - w),
              x2: maxX,
            });
          }
          if (y2 > maxY) {
            store.setPartialRow(SHAPES, id, {
              y1: Math.max(0, maxY - h),
              y2: maxY,
            });
          }
        }
      });
    },
    [store, getShapeDimensions]
  );

  useEffect(() => {
    const { current } = ref;
    const observer = new ResizeObserver(() => updateDimensions(current));
    observer.observe(current);
    updateDimensions(current);
    return () => observer.disconnect();
  }, [ref, store, updateDimensions]);

  const [, setSelectedId] = useSelectedIdState();
  const getRowComponentProps = useCallback((id) => ({ id }), []);
  const handleMouseDown = useCallback(() => setSelectedId(), [setSelectedId]);
  const backId = useBackId();
  return (
    <div id="canvas" onMouseDown={handleMouseDown} ref={ref}>
      {backId == null ? null : (
        <LinkedRowsView
          relationshipId="order"
          firstRowId={backId}
          rowComponent={Shape}
          getRowComponentProps={getRowComponentProps}
        />
      )}
    </div>
  );
};

const between = (value, min, max) =>
  value < min ? min : value > max ? max : value;

const Shape = ({ id }) => {
  const [selectedId, setSelectedId] = useSelectedIdState();
  const selected = id == selectedId;
  const { x1, y1, x2, y2, backColor, type } = useRow(SHAPES, id);

  const store = useStore();
  const getInitial = useCallback(() => store.getRow(SHAPES, id), [store, id]);

  const handleDrag = useSetPartialRowCallback(
    SHAPES,
    id,
    ({ dx, dy, initial }) => ({
      x1: initial.x1 + dx,
      y1: initial.y1 + dy,
      x2: initial.x2 + dx,
      y2: initial.y2 + dy,
    }),
    []
  );
  const handleDragStart = useCallback(
    () => setSelectedId(id),
    [setSelectedId, id]
  );
  const handleDragStop = useSetCheckpointCallback(() => "drag", []);
  const ref = useDraggableObject(
    getInitial,
    handleDrag,
    handleDragStart,
    handleDragStop
  );

  const style = {
    left: `${x1}px`,
    top: `${y1}px`,
    width: `${x2 - x1}px`,
    height: `${y2 - y1}px`,
    background: backColor,
  };

  return (
    <>
      <div
        ref={ref}
        className={`shape ${type}${selected ? " selected" : ""}`}
        style={style}
      >
        <ShapeText id={id} />
      </div>
      {selected ? <ShapeGrips id={id} /> : null}
    </>
  );
};

const ShapeText = ({ id }) => {
  const { text, textColor } = useRow(SHAPES, id);
  const ref = useRef();
  const [editing, setEditing] = useState(false);
  const setCheckpoint = useSetCheckpointCallback(() => "edit text", []);
  const handleDoubleClick = useCallback(() => setEditing(true), []);
  const handleBlur = useCallback(() => {
    setEditing(false);
    setCheckpoint();
  }, [setCheckpoint]);
  const handleChange = useSetCellCallback(
    SHAPES,
    id,
    "text",
    (e) => e.target.value,
    []
  );
  const handleKeyDown = useCallback((e) => {
    if (e.which == 13) {
      e.target.blur();
    }
  }, []);

  useEffect(() => {
    if (editing) {
      ref.current.focus();
    }
  }, [editing, ref]);

  const style = { color: textColor };

  return editing ? (
    <input
      ref={ref}
      style={style}
      value={text}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  ) : (
    <span style={style} onDoubleClick={handleDoubleClick}>
      {text != "" ? text : "\xa0"}
    </span>
  );
};

const ShapeGrips = ({ id }) => {
  const { x1, y1, x2, y2 } = useRow(SHAPES, id);
  const xm = (x1 + x2) / 2;
  const ym = (y1 + y2) / 2;
  return (
    <>
      <Grip m={[1, 1, 0, 0]} id={id} x={x1} y={y1} d="nwse" />
      <Grip m={[0, 1, 0, 0]} id={id} x={xm} y={y1} d="ns" />
      <Grip m={[0, 1, 1, 0]} id={id} x={x2} y={y1} d="nesw" />
      <Grip m={[0, 0, 1, 0]} id={id} x={x2} y={ym} d="ew" />
      <Grip m={[0, 0, 1, 1]} id={id} x={x2} y={y2} d="nwse" />
      <Grip m={[0, 0, 0, 1]} id={id} x={xm} y={y2} d="ns" />
      <Grip m={[1, 0, 0, 1]} id={id} x={x1} y={y2} d="nesw" />
      <Grip m={[1, 0, 0, 0]} id={id} x={x1} y={ym} d="ew" />
    </>
  );
};

const Grip = ({ m: [mx1, my1, mx2, my2], id, x, y, d }) => {
  const store = useStore();
  const getInitial = useCallback(() => store.getRow(SHAPES, id), [store, id]);

  const handleDrag = useSetPartialRowCallback(
    SHAPES,
    id,
    ({ dx, dy, initial }) => ({
      x1: initial.x1 + dx * mx1,
      y1: initial.y1 + dy * my1,
      x2: initial.x2 + dx * mx2,
      y2: initial.y2 + dy * my2,
    }),
    [mx1, my1, mx2, my2]
  );
  const handleDragStop = useSetCheckpointCallback(() => "resize", []);

  return (
    <div
      ref={useDraggableObject(getInitial, handleDrag, null, handleDragStop)}
      className="grip"
      style={{ left: `${x}px`, top: `${y}px`, cursor: `${d}-resize` }}
    />
  );
};
