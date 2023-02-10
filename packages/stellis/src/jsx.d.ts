/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable import/prefer-default-export */
import * as csstype from 'csstype';

/**
 * Based on JSX types
 *
 * https://github.com/adamhaile/surplus/blob/master/index.d.ts
 * https://github.com/infernojs/inferno/blob/master/packages/inferno/src/core/types.ts
 * https://github.com/ryansolid/dom-expressions/blob/main/packages/dom-expressions/src/jsx.d.ts
 */

export namespace JSX {
  type Booleanish = boolean | 'true' | 'false';
  type OverloadedBoolean = boolean | string;
  type Element =
    | ArrayElement
    | FunctionElement
    | PromiseElement
    | string
    | number
    | boolean
    | null
    | undefined
    | SafeElement;
  interface SafeElement {
    t: string;
  }
  interface ArrayElement extends Array<Element> {
    // empty
  }
  interface PromiseElement extends Promise<Element> {
    // empty
  }
  interface FunctionElement {
    (): Element;
  }

  interface StellisSetDirectives {
    html?: string;
  }
  type StellisAttributes = {
    [Key in keyof StellisSetDirectives as `set:${Key}`]?: StellisSetDirectives[Key];
  };
  interface StellisHeadAttributes extends StellisAttributes {
    type: 'pre' | 'post';
    children: JSX.Element;
  }
  interface StellisBodyAttributes extends StellisAttributes {
    type: 'pre' | 'post';
    children: JSX.Element;
  }

  interface StellisErrorBoundaryAttributes {
    fallback: (error: unknown) => JSX.Element;
    children: JSX.Element;
  }

  interface StellisFragmentAttributes extends StellisAttributes {
    children: JSX.Element;
  }

  interface StellisCommentAttributes {
    value: string
  }

  interface StellisNamespace {
    head: StellisHeadAttributes;
    body: StellisBodyAttributes;
    'error-boundary': StellisErrorBoundaryAttributes;
    fragment: StellisFragmentAttributes;
    comment: StellisCommentAttributes;
  }

  type StellisElements = {
    [Key in keyof StellisNamespace as `stellis:${Key}`]: StellisNamespace[Key];
  }

  interface ElementClass {
    // empty, libs can define requirements downstream
  }
  interface ElementAttributesProperty {
    // empty, libs can define requirements downstream
  }
  interface ElementChildrenAttribute {
    // eslint-disable-next-line @typescript-eslint/ban-types
    children: {};
  }
  interface IntrinsicAttributes {
  }
  interface CustomAttributes<T> {
  }
  interface ExplicitAttributes {}
  interface DOMAttributes<T>
    extends CustomAttributes<T>, StellisAttributes {
    children?: Element;
  }
  interface CSSProperties extends csstype.PropertiesHyphen {
    // Override
    [key: `-${string}`]: string | number | undefined
  }

  type HTMLAutocapitalize = 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters';
  type HTMLDir = 'ltr' | 'rtl' | 'auto';
  type HTMLFormEncType = 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';
  type HTMLFormMethod = 'post' | 'get' | 'dialog';
  type HTMLCrossorigin = 'anonymous' | 'use-credentials' | '';
  type HTMLReferrerPolicy =
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
  type HTMLIframeSandbox =
    | 'allow-downloads-without-user-activation'
    | 'allow-downloads'
    | 'allow-forms'
    | 'allow-modals'
    | 'allow-orientation-lock'
    | 'allow-pointer-lock'
    | 'allow-popups'
    | 'allow-popups-to-escape-sandbox'
    | 'allow-presentation'
    | 'allow-same-origin'
    | 'allow-scripts'
    | 'allow-storage-access-by-user-activation'
    | 'allow-top-navigation'
    | 'allow-top-navigation-by-user-activation';
  type HTMLLinkAs =
    | 'audio'
    | 'document'
    | 'embed'
    | 'fetch'
    | 'font'
    | 'image'
    | 'object'
    | 'script'
    | 'style'
    | 'track'
    | 'video'
    | 'worker';
  type AriaRole =
    | 'alert'
    | 'alertdialog'
    | 'application'
    | 'article'
    | 'banner'
    | 'button'
    | 'cell'
    | 'checkbox'
    | 'columnheader'
    | 'combobox'
    | 'complementary'
    | 'contentinfo'
    | 'definition'
    | 'dialog'
    | 'directory'
    | 'document'
    | 'feed'
    | 'figure'
    | 'form'
    | 'grid'
    | 'gridcell'
    | 'group'
    | 'heading'
    | 'img'
    | 'link'
    | 'list'
    | 'listbox'
    | 'listitem'
    | 'log'
    | 'main'
    | 'marquee'
    | 'math'
    | 'menu'
    | 'menubar'
    | 'menuitem'
    | 'menuitemcheckbox'
    | 'menuitemradio'
    | 'meter'
    | 'navigation'
    | 'none'
    | 'note'
    | 'option'
    | 'presentation'
    | 'progressbar'
    | 'radio'
    | 'radiogroup'
    | 'region'
    | 'row'
    | 'rowgroup'
    | 'rowheader'
    | 'scrollbar'
    | 'search'
    | 'searchbox'
    | 'separator'
    | 'slider'
    | 'spinbutton'
    | 'status'
    | 'switch'
    | 'tab'
    | 'table'
    | 'tablist'
    | 'tabpanel'
    | 'term'
    | 'textbox'
    | 'timer'
    | 'toolbar'
    | 'tooltip'
    | 'tree'
    | 'treegrid'
    | 'treeitem';

  // All the WAI-ARIA 1.1 attributes from https://www.w3.org/TR/wai-aria-1.1/
  interface AriaAttributes {
    /**
     * Identifies the currently active element when DOM focus is on a composite widget,
     * textbox, group, or application.
     */
    'aria-activedescendant'?: string;
    /**
     * Indicates whether assistive technologies will present all, or only parts of,
     * the changed region based on the change notifications defined by the aria-relevant
     * attribute.
     */
    'aria-atomic'?: Booleanish;
    /**
     * Indicates whether inputting text could trigger display of one or
     * more predictions of the user's intended value for an input and specifies
     * how predictions would be presented if they are made.
     */
    'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
    /**
     * Indicates an element is being modified and that assistive technologies
     * MAY want to wait until the modifications are complete before exposing them
     * to the user.
     */
    'aria-busy'?: Booleanish;
    /**
     * Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.
     * @see aria-pressed @see aria-selected.
     */
    'aria-checked'?: Booleanish | 'mixed';
    /**
     * Defines the total number of columns in a table, grid, or treegrid.
     * @see aria-colindex.
     */
    'aria-colcount'?: number | string;
    /**
     * Defines an element's column index or position with respect to the total number
     * of columns within a table, grid, or treegrid.
     * @see aria-colcount @see aria-colspan.
     */
    'aria-colindex'?: number | string;
    /**
     * Defines the number of columns spanned by a cell or gridcell within a table,
     * grid, or treegrid.
     * @see aria-colindex @see aria-rowspan.
     */
    'aria-colspan'?: number | string;
    /**
     * Identifies the element (or elements) whose contents or presence are controlled
     * by the current element.
     * @see aria-owns.
     */
    'aria-controls'?: string;
    /** Indicates the element that represents the current item within a container
     * or set of related elements. */
    'aria-current'?: Booleanish | 'page' | 'step' | 'location' | 'date' | 'time';
    /**
     * Identifies the element (or elements) that describes the object.
     * @see aria-labelledby
     */
    'aria-describedby'?: string;
    /**
     * Identifies the element that provides a detailed, extended description for the object.
     * @see aria-describedby.
     */
    'aria-details'?: string;
    /**
     * Indicates that the element is perceivable but disabled, so it is not editable
     * or otherwise operable.
     * @see aria-hidden @see aria-readonly.
     */
    'aria-disabled'?: Booleanish;
    /**
     * Indicates what functions can be performed when a dragged object is released
     * on the drop target.
     * @deprecated in ARIA 1.1
     */
    'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';
    /**
     * Identifies the element that provides an error message for the object.
     * @see aria-invalid @see aria-describedby.
     */
    'aria-errormessage'?: string;
    /**
     * Indicates whether the element, or another grouping element it controls,
     * is currently expanded or collapsed.
     */
    'aria-expanded'?: Booleanish;
    /**
     * Identifies the next element (or elements) in an alternate reading order
     * of content which, at the user's discretion,
     * allows assistive technology to override the general default of reading
     * in document source order.
     */
    'aria-flowto'?: string;
    /**
     * Indicates an element's "grabbed" state in a drag-and-drop operation.
     * @deprecated in ARIA 1.1
     */
    'aria-grabbed'?: Booleanish;
    /**
     * Indicates the availability and type of interactive popup element,
     * such as menu or dialog, that can be triggered by an element.
     */
    'aria-haspopup'?: Booleanish | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
    /**
     * Indicates whether the element is exposed to an accessibility API.
     * @see aria-disabled.
     */
    'aria-hidden'?: Booleanish;
    /**
     * Indicates the entered value does not conform to the format expected by the application.
     * @see aria-errormessage.
     */
    'aria-invalid'?: Booleanish | 'grammar' | 'spelling';
    /**
     * Indicates keyboard shortcuts that an author has implemented to activate
     * or give focus to an element.
     */
    'aria-keyshortcuts'?: string;
    /**
     * Defines a string value that labels the current element.
     * @see aria-labelledby.
     */
    'aria-label'?: string;
    /**
     * Identifies the element (or elements) that labels the current element.
     * @see aria-describedby.
     */
    'aria-labelledby'?: string;
    /** Defines the hierarchical level of an element within a structure. */
    'aria-level'?: number | string;
    /**
     * Indicates that an element will be updated, and
     * describes the types of updates the user agents, assistive technologies,
     * and user can expect from the live region.
     */
    'aria-live'?: 'off' | 'assertive' | 'polite';
    /** Indicates whether an element is modal when displayed. */
    'aria-modal'?: Booleanish;
    /**
     * Indicates whether a text box accepts multiple lines of input
     * or only a single line.
     */
    'aria-multiline'?: Booleanish;
    /**
     * Indicates that the user may select more than one item from
     * the current selectable descendants.
     */
    'aria-multiselectable'?: Booleanish;
    /**
     * Indicates whether the element's orientation is horizontal, vertical,
     * or unknown/ambiguous.
     */
    'aria-orientation'?: 'horizontal' | 'vertical';
    /**
     * Identifies an element (or elements) in order to define a visual, functional,
     * or contextual parent/child relationship
     * between DOM elements where the DOM hierarchy cannot be used to represent the relationship.
     * @see aria-controls.
     */
    'aria-owns'?: string;
    /**
     * Defines a short hint (a word or short phrase) intended to aid the user with
     * data entry when the control has no value.
     * A hint could be a sample value or a brief description of the expected format.
     */
    'aria-placeholder'?: string;
    /**
     * Defines an element's number or position in the current set of listitems
     * or treeitems. Not required if all elements in the set are present in the DOM.
     * @see aria-setsize.
     */
    'aria-posinset'?: number | string;
    /**
     * Indicates the current "pressed" state of toggle buttons.
     * @see aria-checked @see aria-selected.
     */
    'aria-pressed'?: Booleanish | 'mixed';
    /**
     * Indicates that the element is not editable, but is otherwise operable.
     * @see aria-disabled.
     */
    'aria-readonly'?: Booleanish;
    /**
     * Indicates what notifications the user agent will trigger when the accessibility
     * tree within a live region is modified.
     * @see aria-atomic.
     */
    'aria-relevant'?:
      | 'additions'
      | 'additions removals'
      | 'additions text'
      | 'all'
      | 'removals'
      | 'removals additions'
      | 'removals text'
      | 'text'
      | 'text additions'
      | 'text removals';
    /** Indicates that user input is required on the element before a form may be submitted. */
    'aria-required'?: Booleanish;
    /** Defines a human-readable, author-localized description for the role of an element. */
    'aria-roledescription'?: string;
    /**
     * Defines the total number of rows in a table, grid, or treegrid.
     * @see aria-rowindex.
     */
    'aria-rowcount'?: number | string;
    /**
     * Defines an element's row index or position with respect to the total number
     * of rows within a table, grid, or treegrid.
     * @see aria-rowcount @see aria-rowspan.
     */
    'aria-rowindex'?: number | string;
    /**
     * Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.
     * @see aria-rowindex @see aria-colspan.
     */
    'aria-rowspan'?: number | string;
    /**
     * Indicates the current "selected" state of various widgets.
     * @see aria-checked @see aria-pressed.
     */
    'aria-selected'?: Booleanish;
    /**
     * Defines the number of items in the current set of listitems or treeitems.
     * Not required if all elements in the set are present in the DOM.
     * @see aria-posinset.
     */
    'aria-setsize'?: number | string;
    /** Indicates if items in a table or grid are sorted in ascending or descending order. */
    'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other';
    /** Defines the maximum allowed value for a range widget. */
    'aria-valuemax'?: number | string;
    /** Defines the minimum allowed value for a range widget. */
    'aria-valuemin'?: number | string;
    /**
     * Defines the current value for a range widget.
     * @see aria-valuetext.
     */
    'aria-valuenow'?: number | string;
    /** Defines the human readable text alternative of aria-valuenow for a range widget. */
    'aria-valuetext'?: string;
    role?: AriaRole;
  }

  type ClassList =
    | string
    | null
    | undefined
    | number
    | Array<ClassList>
    | { [key: string]: number | boolean | null | undefined };

  type ClassKeys = `class:${string}`;
  type CSSKeys = Exclude<keyof csstype.PropertiesHyphen, `-${string}`>;

  type CSSAttributes = {
    [key in CSSKeys as `style:${key}`]: csstype.PropertiesHyphen[key];
  };

  interface HTMLAttributes<T>
    extends AriaAttributes,
      DOMAttributes<T>,
      CSSAttributes {
    [key: ClassKeys]: boolean;
    style?: CSSProperties | string;
    accessKey?: string;
    class?: ClassList;
    contenteditable?: Booleanish | 'inherit';
    contextmenu?: string;
    dir?: HTMLDir;
    draggable?: Booleanish;
    hidden?: boolean;
    id?: string;
    lang?: string;
    spellcheck?: Booleanish;
    tabindex?: number | string;
    title?: string;
    translate?: 'yes' | 'no';
    about?: string;
    datatype?: string;
    inlist?: any;
    prefix?: string;
    property?: string;
    resource?: string;
    typeof?: string;
    vocab?: string;
    autocapitalize?: HTMLAutocapitalize;
    slot?: string;
    color?: string;
    itemprop?: string;
    itemscope?: boolean;
    itemtype?: string;
    itemid?: string;
    itemref?: string;
    part?: string;
    exportparts?: string;
    inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  }
  interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
    download?: OverloadedBoolean;
    href?: string;
    hreflang?: string;
    media?: string;
    ping?: string;
    referrerpolicy?: HTMLReferrerPolicy;
    rel?: string;
    target?: string;
    type?: string;
  }
  type AudioHTMLAttributes<T> = MediaHTMLAttributes<T>
  interface AreaHTMLAttributes<T> extends HTMLAttributes<T> {
    alt?: string;
    coords?: string;
    download?: OverloadedBoolean;
    href?: string;
    hreflang?: string;
    ping?: string;
    referrerpolicy?: HTMLReferrerPolicy;
    rel?: string;
    shape?: 'rect' | 'circle' | 'poly' | 'default';
    target?: string;
  }
  interface BaseHTMLAttributes<T> extends HTMLAttributes<T> {
    href?: string;
    target?: string;
  }
  interface BlockquoteHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: string;
  }
  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    autofocus?: boolean;
    disabled?: boolean;
    form?: string;
    formaction?: string;
    formenctype?: HTMLFormEncType;
    formmethod?: HTMLFormMethod;
    formnovalidate?: boolean;
    formtarget?: string;
    name?: string;
    type?: 'submit' | 'reset' | 'button';
    value?: string;
  }
  interface CanvasHTMLAttributes<T> extends HTMLAttributes<T> {
    width?: number | string;
    height?: number | string;
  }
  interface ColHTMLAttributes<T> extends HTMLAttributes<T> {
    span?: number | string;
    width?: number | string;
  }
  interface ColgroupHTMLAttributes<T> extends HTMLAttributes<T> {
    span?: number | string;
  }
  interface DataHTMLAttributes<T> extends HTMLAttributes<T> {
    value?: string | string[] | number;
  }
  interface DetailsHtmlAttributes<T> extends HTMLAttributes<T> {
    open?: boolean;
  }
  interface DialogHtmlAttributes<T> extends HTMLAttributes<T> {
    open?: boolean;
  }
  interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
    height?: number | string;
    src?: string;
    type?: string;
    width?: number | string;
  }
  interface FieldsetHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    form?: string;
    name?: string;
  }
  interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
    acceptcharset?: string;
    action?: string;
    autocomplete?: string;
    encoding?: HTMLFormEncType;
    enctype?: HTMLFormEncType;
    method?: HTMLFormMethod;
    name?: string;
    novalidate?: boolean;
    target?: string;
  }
  interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
    allow?: string;
    allowfullscreen?: boolean;
    height?: number | string;
    name?: string;
    referrerpolicy?: HTMLReferrerPolicy;
    sandbox?: HTMLIframeSandbox | string;
    src?: string;
    srcdoc?: string;
    width?: number | string;
  }
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    alt?: string;
    crossorigin?: HTMLCrossorigin;
    decoding?: 'sync' | 'async' | 'auto';
    height?: number | string;
    ismap?: boolean;
    isMap?: boolean;
    loading?: 'eager' | 'lazy';
    referrerpolicy?: HTMLReferrerPolicy;
    sizes?: string;
    src?: string;
    srcset?: string;
    srcSet?: string;
    usemap?: string;
    useMap?: string;
    width?: number | string;
  }
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    accept?: string;
    alt?: string;
    autocomplete?: string;
    autofocus?: boolean;
    capture?: OverloadedBoolean;
    checked?: boolean;
    crossorigin?: HTMLCrossorigin;
    disabled?: boolean;
    form?: string;
    formaction?: string;
    formenctype?: HTMLFormEncType;
    formmethod?: HTMLFormMethod;
    formnovalidate?: boolean;
    formtarget?: string;
    height?: number | string;
    list?: string;
    max?: number | string;
    maxlength?: number | string;
    min?: number | string;
    minlength?: number | string;
    multiple?: boolean;
    name?: string;
    pattern?: string;
    placeholder?: string;
    readonly?: boolean;
    required?: boolean;
    size?: number | string;
    src?: string;
    step?: number | string;
    type?: string;
    value?: string | string[] | number;
    width?: number | string;
  }
  interface InsHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: string;
    datetime?: string;
  }
  interface KeygenHTMLAttributes<T> extends HTMLAttributes<T> {
    autofocus?: boolean;
    challenge?: string;
    disabled?: boolean;
    form?: string;
    keytype?: string;
    keyparams?: string;
    name?: string;
  }
  interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
    for?: string;
    form?: string;
  }
  interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
    value?: number | string;
  }
  interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
    as?: HTMLLinkAs;
    crossorigin?: HTMLCrossorigin;
    disabled?: boolean;
    href?: string;
    hreflang?: string;
    integrity?: string;
    media?: string;
    referrerpolicy?: HTMLReferrerPolicy;
    rel?: string;
    sizes?: string;
    type?: string;
  }
  interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
    name?: string;
  }
  interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
    autoplay?: boolean;
    controls?: boolean;
    crossorigin?: HTMLCrossorigin;
    loop?: boolean;
    mediagroup?: string;
    muted?: boolean;
    preload?: 'none' | 'metadata' | 'auto' | '';
    src?: string;
  }
  interface MenuHTMLAttributes<T> extends HTMLAttributes<T> {
    label?: string;
    type?: 'context' | 'toolbar';
  }
  interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
    charset?: string;
    content?: string;
    'http-equiv'?: string;
    name?: string;
  }
  interface MeterHTMLAttributes<T> extends HTMLAttributes<T> {
    form?: string;
    high?: number | string;
    low?: number | string;
    max?: number | string;
    min?: number | string;
    optimum?: number | string;
    value?: string | string[] | number;
  }
  interface QuoteHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: string;
  }
  interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> {
    data?: string;
    form?: string;
    height?: number | string;
    name?: string;
    type?: string;
    usemap?: string;
    width?: number | string;
  }
  interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
    reversed?: boolean;
    start?: number | string;
    type?: '1' | 'a' | 'A' | 'i' | 'I';
  }
  interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    label?: string;
  }
  interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    label?: string;
    selected?: boolean;
    value?: string | string[] | number;
  }
  interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
    form?: string;
    for?: string;
    name?: string;
  }
  interface ParamHTMLAttributes<T> extends HTMLAttributes<T> {
    name?: string;
    value?: string | string[] | number;
  }
  interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
    max?: number | string;
    value?: string | string[] | number;
  }
  interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> {
    async?: boolean;
    charset?: string;
    crossorigin?: HTMLCrossorigin;
    defer?: boolean;
    integrity?: string;
    nomodule?: boolean;
    nonce?: string;
    referrerpolicy?: HTMLReferrerPolicy;
    src?: string;
    type?: string;
  }
  interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
    autocomplete?: string;
    autofocus?: boolean;
    disabled?: boolean;
    form?: string;
    multiple?: boolean;
    name?: string;
    required?: boolean;
    size?: number | string;
    value?: string | string[] | number;
  }
  interface HTMLSlotElementAttributes<T = HTMLSlotElement> extends HTMLAttributes<T> {
    name?: string;
  }
  interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
    media?: string;
    sizes?: string;
    src?: string;
    srcset?: string;
    type?: string;
  }
  interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
    media?: string;
    nonce?: string;
    scoped?: boolean;
    type?: string;
  }
  interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
    colspan?: number | string;
    headers?: string;
    rowspan?: number | string;
  }
  interface TemplateHTMLAttributes<T extends HTMLTemplateElement> extends HTMLAttributes<T> {
    content?: DocumentFragment;
  }
  interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
    autocomplete?: string;
    autofocus?: boolean;
    cols?: number | string;
    dirname?: string;
    disabled?: boolean;
    form?: string;
    maxlength?: number | string;
    minlength?: number | string;
    name?: string;
    placeholder?: string;
    readonly?: boolean;
    required?: boolean;
    rows?: number | string;
    value?: string | string[] | number;
    wrap?: 'hard' | 'soft' | 'off';
  }
  interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
    colspan?: number | string;
    headers?: string;
    rowspan?: number | string;
    scope?: 'col' | 'row' | 'rowgroup' | 'colgroup';
  }
  interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
    datetime?: string;
  }
  interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
    default?: boolean;
    kind?: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata';
    label?: string;
    src?: string;
    srclang?: string;
  }
  interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
    height?: number | string;
    playsinline?: boolean;
    poster?: string;
    width?: number | string;
  }
  type SVGPreserveAspectRatio =
    | 'none'
    | 'xMinYMin'
    | 'xMidYMin'
    | 'xMaxYMin'
    | 'xMinYMid'
    | 'xMidYMid'
    | 'xMaxYMid'
    | 'xMinYMax'
    | 'xMidYMax'
    | 'xMaxYMax'
    | 'xMinYMin meet'
    | 'xMidYMin meet'
    | 'xMaxYMin meet'
    | 'xMinYMid meet'
    | 'xMidYMid meet'
    | 'xMaxYMid meet'
    | 'xMinYMax meet'
    | 'xMidYMax meet'
    | 'xMaxYMax meet'
    | 'xMinYMin slice'
    | 'xMidYMin slice'
    | 'xMaxYMin slice'
    | 'xMinYMid slice'
    | 'xMidYMid slice'
    | 'xMaxYMid slice'
    | 'xMinYMax slice'
    | 'xMidYMax slice'
    | 'xMaxYMax slice';
  type ImagePreserveAspectRatio =
    | SVGPreserveAspectRatio
    | 'defer none'
    | 'defer xMinYMin'
    | 'defer xMidYMin'
    | 'defer xMaxYMin'
    | 'defer xMinYMid'
    | 'defer xMidYMid'
    | 'defer xMaxYMid'
    | 'defer xMinYMax'
    | 'defer xMidYMax'
    | 'defer xMaxYMax'
    | 'defer xMinYMin meet'
    | 'defer xMidYMin meet'
    | 'defer xMaxYMin meet'
    | 'defer xMinYMid meet'
    | 'defer xMidYMid meet'
    | 'defer xMaxYMid meet'
    | 'defer xMinYMax meet'
    | 'defer xMidYMax meet'
    | 'defer xMaxYMax meet'
    | 'defer xMinYMin slice'
    | 'defer xMidYMin slice'
    | 'defer xMaxYMin slice'
    | 'defer xMinYMid slice'
    | 'defer xMidYMid slice'
    | 'defer xMaxYMid slice'
    | 'defer xMinYMax slice'
    | 'defer xMidYMax slice'
    | 'defer xMaxYMax slice';
  type SVGUnits = 'userSpaceOnUse' | 'objectBoundingBox';
  interface CoreSVGAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    id?: string;
    lang?: string;
    tabindex?: number | string;
  }
  interface StylableSVGAttributes {
    class?: string | undefined;
  }
  interface TransformableSVGAttributes {
    transform?: string;
  }
  interface ConditionalProcessingSVGAttributes {
    requiredExtensions?: string;
    requiredFeatures?: string;
    systemLanguage?: string;
  }
  interface ExternalResourceSVGAttributes {
    externalResourcesRequired?: Booleanish;
  }
  interface AnimationTimingSVGAttributes {
    begin?: string;
    dur?: string;
    end?: string;
    min?: string;
    max?: string;
    restart?: 'always' | 'whenNotActive' | 'never';
    repeatCount?: number | 'indefinite';
    repeatDur?: string;
    fill?: 'freeze' | 'remove';
  }
  interface AnimationValueSVGAttributes {
    calcMode?: 'discrete' | 'linear' | 'paced' | 'spline';
    values?: string;
    keyTimes?: string;
    keySplines?: string;
    from?: number | string;
    to?: number | string;
    by?: number | string;
  }
  interface AnimationAdditionSVGAttributes {
    attributeName?: string;
    additive?: 'replace' | 'sum';
    accumulate?: 'none' | 'sum';
  }
  interface AnimationAttributeTargetSVGAttributes {
    attributeName?: string;
    attributeType?: 'CSS' | 'XML' | 'auto';
  }
  interface PresentationSVGAttributes {
    'alignment-baseline'?:
      | 'auto'
      | 'baseline'
      | 'before-edge'
      | 'text-before-edge'
      | 'middle'
      | 'central'
      | 'after-edge'
      | 'text-after-edge'
      | 'ideographic'
      | 'alphabetic'
      | 'hanging'
      | 'mathematical'
      | 'inherit';
    'baseline-shift'?: number | string;
    clip?: string;
    'clip-path'?: string;
    'clip-rule'?: 'nonzero' | 'evenodd' | 'inherit';
    color?: string;
    'color-interpolation'?: 'auto' | 'sRGB' | 'linearRGB' | 'inherit';
    'color-interpolation-filters'?: 'auto' | 'sRGB' | 'linearRGB' | 'inherit';
    'color-profile'?: string;
    'color-rendering'?: 'auto' | 'optimizeSpeed' | 'optimizeQuality' | 'inherit';
    cursor?: string;
    direction?: 'ltr' | 'rtl' | 'inherit';
    display?: string;
    'dominant-baseline'?:
      | 'auto'
      | 'text-bottom'
      | 'alphabetic'
      | 'ideographic'
      | 'middle'
      | 'central'
      | 'mathematical'
      | 'hanging'
      | 'text-top'
      | 'inherit';
    'enable-background'?: string;
    fill?: string;
    'fill-opacity'?: number | string | 'inherit';
    'fill-rule'?: 'nonzero' | 'evenodd' | 'inherit';
    filter?: string;
    'flood-color'?: string;
    'flood-opacity'?: number | string | 'inherit';
    'font-family'?: string;
    'font-size'?: string;
    'font-size-adjust'?: number | string;
    'font-stretch'?: string;
    'font-style'?: 'normal' | 'italic' | 'oblique' | 'inherit';
    'font-variant'?: string;
    'font-weight'?: number | string;
    'glyph-orientation-horizontal'?: string;
    'glyph-orientation-vertical'?: string;
    'image-rendering'?: 'auto' | 'optimizeQuality' | 'optimizeSpeed' | 'inherit';
    kerning?: string;
    'letter-spacing'?: number | string;
    'lighting-color'?: string;
    'marker-end'?: string;
    'marker-mid'?: string;
    'marker-start'?: string;
    mask?: string;
    opacity?: number | string | 'inherit';
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto' | 'inherit';
    'pointer-events'?:
      | 'bounding-box'
      | 'visiblePainted'
      | 'visibleFill'
      | 'visibleStroke'
      | 'visible'
      | 'painted'
      | 'color'
      | 'fill'
      | 'stroke'
      | 'all'
      | 'none'
      | 'inherit';
    'shape-rendering'?: 'auto' | 'optimizeSpeed' | 'crispEdges' | 'geometricPrecision' | 'inherit';
    'stop-color'?: string;
    'stop-opacity'?: number | string | 'inherit';
    stroke?: string;
    'stroke-dasharray'?: string;
    'stroke-dashoffset'?: number | string;
    'stroke-linecap'?: 'butt' | 'round' | 'square' | 'inherit';
    'stroke-linejoin'?: 'arcs' | 'bevel' | 'miter' | 'miter-clip' | 'round' | 'inherit';
    'stroke-miterlimit'?: number | string | 'inherit';
    'stroke-opacity'?: number | string | 'inherit';
    'stroke-width'?: number | string;
    'text-anchor'?: 'start' | 'middle' | 'end' | 'inherit';
    'text-decoration'?: 'none' | 'underline' | 'overline' | 'line-through' | 'blink' | 'inherit';
    'text-rendering'?:
      | 'auto'
      | 'optimizeSpeed'
      | 'optimizeLegibility'
      | 'geometricPrecision'
      | 'inherit';
    'unicode-bidi'?: string;
    visibility?: 'visible' | 'hidden' | 'collapse' | 'inherit';
    'word-spacing'?: number | string;
    'writing-mode'?: 'lr-tb' | 'rl-tb' | 'tb-rl' | 'lr' | 'rl' | 'tb' | 'inherit';
  }
  interface AnimationElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      ExternalResourceSVGAttributes,
      ConditionalProcessingSVGAttributes {}
  interface ContainerElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      Pick<
        PresentationSVGAttributes,
        | 'clip-path'
        | 'mask'
        | 'cursor'
        | 'opacity'
        | 'filter'
        | 'enable-background'
        | 'color-interpolation'
        | 'color-rendering'
      > {}
  interface FilterPrimitiveElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      Pick<PresentationSVGAttributes, 'color-interpolation-filters'> {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
    result?: string;
  }
  interface SingleInputFilterSVGAttributes {
    in?: string;
  }
  interface DoubleInputFilterSVGAttributes {
    in?: string;
    in2?: string;
  }
  interface FitToViewBoxSVGAttributes {
    viewBox?: string;
    preserveAspectRatio?: SVGPreserveAspectRatio;
  }
  interface GradientElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes {
    gradientUnits?: SVGUnits;
    gradientTransform?: string;
    spreadMethod?: 'pad' | 'reflect' | 'repeat';
  }
  interface GraphicsElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      Pick<
        PresentationSVGAttributes,
        | 'clip-rule'
        | 'mask'
        | 'pointer-events'
        | 'cursor'
        | 'opacity'
        | 'filter'
        | 'display'
        | 'visibility'
        | 'color-interpolation'
        | 'color-rendering'
      > {}
  type LightSourceElementSVGAttributes<T> = CoreSVGAttributes<T>
  interface NewViewportSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      Pick<PresentationSVGAttributes, 'overflow' | 'clip'> {
    viewBox?: string;
  }
  interface ShapeElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      Pick<
        PresentationSVGAttributes,
        | 'color'
        | 'fill'
        | 'fill-rule'
        | 'fill-opacity'
        | 'stroke'
        | 'stroke-width'
        | 'stroke-linecap'
        | 'stroke-linejoin'
        | 'stroke-miterlimit'
        | 'stroke-dasharray'
        | 'stroke-dashoffset'
        | 'stroke-opacity'
        | 'shape-rendering'
      > {}
  interface TextContentElementSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      Pick<
        PresentationSVGAttributes,
        | 'font-family'
        | 'font-style'
        | 'font-variant'
        | 'font-weight'
        | 'font-stretch'
        | 'font-size'
        | 'font-size-adjust'
        | 'kerning'
        | 'letter-spacing'
        | 'word-spacing'
        | 'text-decoration'
        | 'glyph-orientation-horizontal'
        | 'glyph-orientation-vertical'
        | 'direction'
        | 'unicode-bidi'
        | 'text-anchor'
        | 'dominant-baseline'
        | 'color'
        | 'fill'
        | 'fill-rule'
        | 'fill-opacity'
        | 'stroke'
        | 'stroke-width'
        | 'stroke-linecap'
        | 'stroke-linejoin'
        | 'stroke-miterlimit'
        | 'stroke-dasharray'
        | 'stroke-dashoffset'
        | 'stroke-opacity'
      > {}
  interface ZoomAndPanSVGAttributes {
    zoomAndPan?: 'disable' | 'magnify';
  }
  interface AnimateSVGAttributes<T>
    extends AnimationElementSVGAttributes<T>,
      AnimationAttributeTargetSVGAttributes,
      AnimationTimingSVGAttributes,
      AnimationValueSVGAttributes,
      AnimationAdditionSVGAttributes,
      Pick<PresentationSVGAttributes, 'color-interpolation' | 'color-rendering'> {}
  interface AnimateMotionSVGAttributes<T>
    extends AnimationElementSVGAttributes<T>,
      AnimationTimingSVGAttributes,
      AnimationValueSVGAttributes,
      AnimationAdditionSVGAttributes {
    path?: string;
    keyPoints?: string;
    rotate?: number | string | 'auto' | 'auto-reverse';
    origin?: 'default';
  }
  interface AnimateTransformSVGAttributes<T>
    extends AnimationElementSVGAttributes<T>,
      AnimationAttributeTargetSVGAttributes,
      AnimationTimingSVGAttributes,
      AnimationValueSVGAttributes,
      AnimationAdditionSVGAttributes {
    type?: 'translate' | 'scale' | 'rotate' | 'skewX' | 'skewY';
  }
  interface CircleSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes {
    cx?: number | string;
    cy?: number | string;
    r?: number | string;
  }
  interface ClipPathSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'clip-path'> {
    clipPathUnits?: SVGUnits;
  }
  interface DefsSVGAttributes<T>
    extends ContainerElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes {}
  interface DescSVGAttributes<T> extends CoreSVGAttributes<T>, StylableSVGAttributes {}
  interface EllipseSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes {
    cx?: number | string;
    cy?: number | string;
    rx?: number | string;
    ry?: number | string;
  }
  interface FeBlendSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      DoubleInputFilterSVGAttributes,
      StylableSVGAttributes {
    mode?: 'normal' | 'multiply' | 'screen' | 'darken' | 'lighten';
  }
  interface FeColorMatrixSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes {
    type?: 'matrix' | 'saturate' | 'hueRotate' | 'luminanceToAlpha';
    values?: string;
  }
  interface FeComponentTransferSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes {}
  interface FeCompositeSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      DoubleInputFilterSVGAttributes,
      StylableSVGAttributes {
    operator?: 'over' | 'in' | 'out' | 'atop' | 'xor' | 'arithmetic';
    k1?: number | string;
    k2?: number | string;
    k3?: number | string;
    k4?: number | string;
  }
  interface FeConvolveMatrixSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes {
    order?: number | string;
    kernelMatrix?: string;
    divisor?: number | string;
    bias?: number | string;
    targetX?: number | string;
    targetY?: number | string;
    edgeMode?: 'duplicate' | 'wrap' | 'none';
    kernelUnitLength?: number | string;
    preserveAlpha?: Booleanish;
  }
  interface FeDiffuseLightingSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes,
      Pick<PresentationSVGAttributes, 'color' | 'lighting-color'> {
    surfaceScale?: number | string;
    diffuseConstant?: number | string;
    kernelUnitLength?: number | string;
  }
  interface FeDisplacementMapSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      DoubleInputFilterSVGAttributes,
      StylableSVGAttributes {
    scale?: number | string;
    xChannelSelector?: 'R' | 'G' | 'B' | 'A';
    yChannelSelector?: 'R' | 'G' | 'B' | 'A';
  }
  interface FeDistantLightSVGAttributes<T> extends LightSourceElementSVGAttributes<T> {
    azimuth?: number | string;
    elevation?: number | string;
  }
  interface FeFloodSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      StylableSVGAttributes,
      Pick<PresentationSVGAttributes, 'color' | 'flood-color' | 'flood-opacity'> {}
  interface FeFuncSVGAttributes<T> extends CoreSVGAttributes<T> {
    type?: 'identity' | 'table' | 'discrete' | 'linear' | 'gamma';
    tableValues?: string;
    slope?: number | string;
    intercept?: number | string;
    amplitude?: number | string;
    exponent?: number | string;
    offset?: number | string;
  }
  interface FeGaussianBlurSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes {
    stdDeviation?: number | string;
  }
  interface FeImageSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes {
    preserveAspectRatio?: SVGPreserveAspectRatio;
    href?: string;
  }
  interface FeMergeSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      StylableSVGAttributes {}
  interface FeMergeNodeSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      SingleInputFilterSVGAttributes {}
  interface FeMorphologySVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes {
    operator?: 'erode' | 'dilate';
    radius?: number | string;
  }
  interface FeOffsetSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes {
    dx?: number | string;
    dy?: number | string;
  }
  interface FePointLightSVGAttributes<T> extends LightSourceElementSVGAttributes<T> {
    x?: number | string;
    y?: number | string;
    z?: number | string;
  }
  interface FeSpecularLightingSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes,
      Pick<PresentationSVGAttributes, 'color' | 'lighting-color'> {
    surfaceScale?: string;
    specularConstant?: string;
    specularExponent?: string;
    kernelUnitLength?: number | string;
  }
  interface FeSpotLightSVGAttributes<T> extends LightSourceElementSVGAttributes<T> {
    x?: number | string;
    y?: number | string;
    z?: number | string;
    pointsAtX?: number | string;
    pointsAtY?: number | string;
    pointsAtZ?: number | string;
    specularExponent?: number | string;
    limitingConeAngle?: number | string;
  }
  interface FeTileSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      SingleInputFilterSVGAttributes,
      StylableSVGAttributes {}
  interface FeTurbulanceSVGAttributes<T>
    extends FilterPrimitiveElementSVGAttributes<T>,
      StylableSVGAttributes {
    baseFrequency?: number | string;
    numOctaves?: number | string;
    seed?: number | string;
    stitchTiles?: 'stitch' | 'noStitch';
    type?: 'fractalNoise' | 'turbulence';
  }
  interface FilterSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes {
    filterUnits?: SVGUnits;
    primitiveUnits?: SVGUnits;
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
    filterRes?: number | string;
  }
  interface ForeignObjectSVGAttributes<T>
    extends NewViewportSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'display' | 'visibility'> {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
  }
  interface GSVGAttributes<T>
    extends ContainerElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'display' | 'visibility'> {}
  interface ImageSVGAttributes<T>
    extends NewViewportSVGAttributes<T>,
      GraphicsElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'color-profile' | 'image-rendering'> {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
    preserveAspectRatio?: ImagePreserveAspectRatio;
    href?: string;
  }
  interface LineSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'marker-start' | 'marker-mid' | 'marker-end'> {
    x1?: number | string;
    y1?: number | string;
    x2?: number | string;
    y2?: number | string;
  }
  interface LinearGradientSVGAttributes<T> extends GradientElementSVGAttributes<T> {
    x1?: number | string;
    x2?: number | string;
    y1?: number | string;
    y2?: number | string;
  }
  interface MarkerSVGAttributes<T>
    extends ContainerElementSVGAttributes<T>,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      FitToViewBoxSVGAttributes,
      Pick<PresentationSVGAttributes, 'overflow' | 'clip'> {
    markerUnits?: 'strokeWidth' | 'userSpaceOnUse';
    refX?: number | string;
    refY?: number | string;
    markerWidth?: number | string;
    markerHeight?: number | string;
    orient?: string;
  }
  interface MaskSVGAttributes<T>
    extends Omit<ContainerElementSVGAttributes<T>, 'opacity' | 'filter'>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes {
    maskUnits?: SVGUnits;
    maskContentUnits?: SVGUnits;
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
  }
  type MetadataSVGAttributes<T> = CoreSVGAttributes<T>
  interface PathSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'marker-start' | 'marker-mid' | 'marker-end'> {
    d?: string;
    pathLength?: number | string;
  }
  interface PatternSVGAttributes<T>
    extends ContainerElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      FitToViewBoxSVGAttributes,
      Pick<PresentationSVGAttributes, 'overflow' | 'clip'> {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
    patternUnits?: SVGUnits;
    patternContentUnits?: SVGUnits;
    patternTransform?: string;
  }
  interface PolygonSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'marker-start' | 'marker-mid' | 'marker-end'> {
    points?: string;
  }
  interface PolylineSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'marker-start' | 'marker-mid' | 'marker-end'> {
    points?: string;
  }
  interface RadialGradientSVGAttributes<T> extends GradientElementSVGAttributes<T> {
    cx?: number | string;
    cy?: number | string;
    r?: number | string;
    fx?: number | string;
    fy?: number | string;
  }
  interface RectSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ShapeElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
    rx?: number | string;
    ry?: number | string;
  }
  interface StopSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      StylableSVGAttributes,
      Pick<PresentationSVGAttributes, 'color' | 'stop-color' | 'stop-opacity'> {
    offset?: number | string;
  }
  interface SvgSVGAttributes<T>
    extends ContainerElementSVGAttributes<T>,
      NewViewportSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      FitToViewBoxSVGAttributes,
      ZoomAndPanSVGAttributes,
      PresentationSVGAttributes {
    version?: string;
    baseProfile?: string;
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
    contentScriptType?: string;
    contentStyleType?: string;
    xmlns?: string;
  }
  interface SwitchSVGAttributes<T>
    extends ContainerElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'display' | 'visibility'> {}
  interface SymbolSVGAttributes<T>
    extends ContainerElementSVGAttributes<T>,
      NewViewportSVGAttributes<T>,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      FitToViewBoxSVGAttributes {}
  interface TextSVGAttributes<T>
    extends TextContentElementSVGAttributes<T>,
      GraphicsElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes,
      Pick<PresentationSVGAttributes, 'writing-mode' | 'text-rendering'> {
    x?: number | string;
    y?: number | string;
    dx?: number | string;
    dy?: number | string;
    rotate?: number | string;
    textLength?: number | string;
    lengthAdjust?: 'spacing' | 'spacingAndGlyphs';
  }
  interface TextPathSVGAttributes<T>
    extends TextContentElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      Pick<
        PresentationSVGAttributes,
        'alignment-baseline' | 'baseline-shift' | 'display' | 'visibility'
      > {
    startOffset?: number | string;
    method?: 'align' | 'stretch';
    spacing?: 'auto' | 'exact';
    href?: string;
  }
  interface TSpanSVGAttributes<T>
    extends TextContentElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      Pick<
        PresentationSVGAttributes,
        'alignment-baseline' | 'baseline-shift' | 'display' | 'visibility'
      > {
    x?: number | string;
    y?: number | string;
    dx?: number | string;
    dy?: number | string;
    rotate?: number | string;
    textLength?: number | string;
    lengthAdjust?: 'spacing' | 'spacingAndGlyphs';
  }
  interface UseSVGAttributes<T>
    extends GraphicsElementSVGAttributes<T>,
      ConditionalProcessingSVGAttributes,
      ExternalResourceSVGAttributes,
      StylableSVGAttributes,
      TransformableSVGAttributes {
    x?: number | string;
    y?: number | string;
    width?: number | string;
    height?: number | string;
    href?: string;
  }
  interface ViewSVGAttributes<T>
    extends CoreSVGAttributes<T>,
      ExternalResourceSVGAttributes,
      FitToViewBoxSVGAttributes,
      ZoomAndPanSVGAttributes {
    viewTarget?: string;
  }
  /**
   * @type {HTMLElementTagNameMap}
   */
  interface HTMLElementTags {
    a: AnchorHTMLAttributes<HTMLAnchorElement>;
    abbr: HTMLAttributes<HTMLElement>;
    address: HTMLAttributes<HTMLElement>;
    area: AreaHTMLAttributes<HTMLAreaElement>;
    article: HTMLAttributes<HTMLElement>;
    aside: HTMLAttributes<HTMLElement>;
    audio: AudioHTMLAttributes<HTMLAudioElement>;
    b: HTMLAttributes<HTMLElement>;
    base: BaseHTMLAttributes<HTMLBaseElement>;
    bdi: HTMLAttributes<HTMLElement>;
    bdo: HTMLAttributes<HTMLElement>;
    blockquote: BlockquoteHTMLAttributes<HTMLElement>;
    body: HTMLAttributes<HTMLBodyElement>;
    br: HTMLAttributes<HTMLBRElement>;
    button: ButtonHTMLAttributes<HTMLButtonElement>;
    canvas: CanvasHTMLAttributes<HTMLCanvasElement>;
    caption: HTMLAttributes<HTMLElement>;
    cite: HTMLAttributes<HTMLElement>;
    code: HTMLAttributes<HTMLElement>;
    col: ColHTMLAttributes<HTMLTableColElement>;
    colgroup: ColgroupHTMLAttributes<HTMLTableColElement>;
    data: DataHTMLAttributes<HTMLElement>;
    datalist: HTMLAttributes<HTMLDataListElement>;
    dd: HTMLAttributes<HTMLElement>;
    del: HTMLAttributes<HTMLElement>;
    details: DetailsHtmlAttributes<HTMLDetailsElement>;
    dfn: HTMLAttributes<HTMLElement>;
    dialog: DialogHtmlAttributes<HTMLDialogElement>;
    div: HTMLAttributes<HTMLDivElement>;
    dl: HTMLAttributes<HTMLDListElement>;
    dt: HTMLAttributes<HTMLElement>;
    em: HTMLAttributes<HTMLElement>;
    embed: EmbedHTMLAttributes<HTMLEmbedElement>;
    fieldset: FieldsetHTMLAttributes<HTMLFieldSetElement>;
    figcaption: HTMLAttributes<HTMLElement>;
    figure: HTMLAttributes<HTMLElement>;
    footer: HTMLAttributes<HTMLElement>;
    form: FormHTMLAttributes<HTMLFormElement>;
    h1: HTMLAttributes<HTMLHeadingElement>;
    h2: HTMLAttributes<HTMLHeadingElement>;
    h3: HTMLAttributes<HTMLHeadingElement>;
    h4: HTMLAttributes<HTMLHeadingElement>;
    h5: HTMLAttributes<HTMLHeadingElement>;
    h6: HTMLAttributes<HTMLHeadingElement>;
    head: HTMLAttributes<HTMLHeadElement>;
    header: HTMLAttributes<HTMLElement>;
    hgroup: HTMLAttributes<HTMLElement>;
    hr: HTMLAttributes<HTMLHRElement>;
    html: HTMLAttributes<HTMLHtmlElement>;
    i: HTMLAttributes<HTMLElement>;
    iframe: IframeHTMLAttributes<HTMLIFrameElement>;
    img: ImgHTMLAttributes<HTMLImageElement>;
    input: InputHTMLAttributes<HTMLInputElement>;
    ins: InsHTMLAttributes<HTMLModElement>;
    kbd: HTMLAttributes<HTMLElement>;
    label: LabelHTMLAttributes<HTMLLabelElement>;
    legend: HTMLAttributes<HTMLLegendElement>;
    li: LiHTMLAttributes<HTMLLIElement>;
    link: LinkHTMLAttributes<HTMLLinkElement>;
    main: HTMLAttributes<HTMLElement>;
    map: MapHTMLAttributes<HTMLMapElement>;
    mark: HTMLAttributes<HTMLElement>;
    menu: MenuHTMLAttributes<HTMLElement>;
    meta: MetaHTMLAttributes<HTMLMetaElement>;
    meter: MeterHTMLAttributes<HTMLElement>;
    nav: HTMLAttributes<HTMLElement>;
    noscript: HTMLAttributes<HTMLElement>;
    object: ObjectHTMLAttributes<HTMLObjectElement>;
    ol: OlHTMLAttributes<HTMLOListElement>;
    optgroup: OptgroupHTMLAttributes<HTMLOptGroupElement>;
    option: OptionHTMLAttributes<HTMLOptionElement>;
    output: OutputHTMLAttributes<HTMLElement>;
    p: HTMLAttributes<HTMLParagraphElement>;
    picture: HTMLAttributes<HTMLElement>;
    pre: HTMLAttributes<HTMLPreElement>;
    progress: ProgressHTMLAttributes<HTMLProgressElement>;
    q: QuoteHTMLAttributes<HTMLQuoteElement>;
    rp: HTMLAttributes<HTMLElement>;
    rt: HTMLAttributes<HTMLElement>;
    ruby: HTMLAttributes<HTMLElement>;
    s: HTMLAttributes<HTMLElement>;
    samp: HTMLAttributes<HTMLElement>;
    script: ScriptHTMLAttributes<HTMLElement>;
    section: HTMLAttributes<HTMLElement>;
    select: SelectHTMLAttributes<HTMLSelectElement>;
    slot: HTMLSlotElementAttributes;
    small: HTMLAttributes<HTMLElement>;
    source: SourceHTMLAttributes<HTMLSourceElement>;
    span: HTMLAttributes<HTMLSpanElement>;
    strong: HTMLAttributes<HTMLElement>;
    style: StyleHTMLAttributes<HTMLStyleElement>;
    sub: HTMLAttributes<HTMLElement>;
    summary: HTMLAttributes<HTMLElement>;
    sup: HTMLAttributes<HTMLElement>;
    table: HTMLAttributes<HTMLTableElement>;
    tbody: HTMLAttributes<HTMLTableSectionElement>;
    td: TdHTMLAttributes<HTMLTableCellElement>;
    template: TemplateHTMLAttributes<HTMLTemplateElement>;
    textarea: TextareaHTMLAttributes<HTMLTextAreaElement>;
    tfoot: HTMLAttributes<HTMLTableSectionElement>;
    th: ThHTMLAttributes<HTMLTableCellElement>;
    thead: HTMLAttributes<HTMLTableSectionElement>;
    time: TimeHTMLAttributes<HTMLElement>;
    title: HTMLAttributes<HTMLTitleElement>;
    tr: HTMLAttributes<HTMLTableRowElement>;
    track: TrackHTMLAttributes<HTMLTrackElement>;
    u: HTMLAttributes<HTMLElement>;
    ul: HTMLAttributes<HTMLUListElement>;
    var: HTMLAttributes<HTMLElement>;
    video: VideoHTMLAttributes<HTMLVideoElement>;
    wbr: HTMLAttributes<HTMLElement>;
  }
  /**
   * @type {HTMLElementDeprecatedTagNameMap}
   */
  interface HTMLElementDeprecatedTags {
    big: HTMLAttributes<HTMLElement>;
    keygen: KeygenHTMLAttributes<HTMLElement>;
    menuitem: HTMLAttributes<HTMLElement>;
    noindex: HTMLAttributes<HTMLElement>;
    param: ParamHTMLAttributes<HTMLParamElement>;
  }
  /**
   * @type {SVGElementTagNameMap}
   */
  interface SVGElementTags {
    animate: AnimateSVGAttributes<SVGAnimateElement>;
    animateMotion: AnimateMotionSVGAttributes<SVGAnimateMotionElement>;
    animateTransform: AnimateTransformSVGAttributes<SVGAnimateTransformElement>;
    circle: CircleSVGAttributes<SVGCircleElement>;
    clipPath: ClipPathSVGAttributes<SVGClipPathElement>;
    defs: DefsSVGAttributes<SVGDefsElement>;
    desc: DescSVGAttributes<SVGDescElement>;
    ellipse: EllipseSVGAttributes<SVGEllipseElement>;
    feBlend: FeBlendSVGAttributes<SVGFEBlendElement>;
    feColorMatrix: FeColorMatrixSVGAttributes<SVGFEColorMatrixElement>;
    feComponentTransfer: FeComponentTransferSVGAttributes<SVGFEComponentTransferElement>;
    feComposite: FeCompositeSVGAttributes<SVGFECompositeElement>;
    feConvolveMatrix: FeConvolveMatrixSVGAttributes<SVGFEConvolveMatrixElement>;
    feDiffuseLighting: FeDiffuseLightingSVGAttributes<SVGFEDiffuseLightingElement>;
    feDisplacementMap: FeDisplacementMapSVGAttributes<SVGFEDisplacementMapElement>;
    feDistantLight: FeDistantLightSVGAttributes<SVGFEDistantLightElement>;
    feDropShadow: Partial<SVGFEDropShadowElement>;
    feFlood: FeFloodSVGAttributes<SVGFEFloodElement>;
    feFuncA: FeFuncSVGAttributes<SVGFEFuncAElement>;
    feFuncB: FeFuncSVGAttributes<SVGFEFuncBElement>;
    feFuncG: FeFuncSVGAttributes<SVGFEFuncGElement>;
    feFuncR: FeFuncSVGAttributes<SVGFEFuncRElement>;
    feGaussianBlur: FeGaussianBlurSVGAttributes<SVGFEGaussianBlurElement>;
    feImage: FeImageSVGAttributes<SVGFEImageElement>;
    feMerge: FeMergeSVGAttributes<SVGFEMergeElement>;
    feMergeNode: FeMergeNodeSVGAttributes<SVGFEMergeNodeElement>;
    feMorphology: FeMorphologySVGAttributes<SVGFEMorphologyElement>;
    feOffset: FeOffsetSVGAttributes<SVGFEOffsetElement>;
    fePointLight: FePointLightSVGAttributes<SVGFEPointLightElement>;
    feSpecularLighting: FeSpecularLightingSVGAttributes<SVGFESpecularLightingElement>;
    feSpotLight: FeSpotLightSVGAttributes<SVGFESpotLightElement>;
    feTile: FeTileSVGAttributes<SVGFETileElement>;
    feTurbulence: FeTurbulanceSVGAttributes<SVGFETurbulenceElement>;
    filter: FilterSVGAttributes<SVGFilterElement>;
    foreignObject: ForeignObjectSVGAttributes<SVGForeignObjectElement>;
    g: GSVGAttributes<SVGGElement>;
    image: ImageSVGAttributes<SVGImageElement>;
    line: LineSVGAttributes<SVGLineElement>;
    linearGradient: LinearGradientSVGAttributes<SVGLinearGradientElement>;
    marker: MarkerSVGAttributes<SVGMarkerElement>;
    mask: MaskSVGAttributes<SVGMaskElement>;
    metadata: MetadataSVGAttributes<SVGMetadataElement>;
    mpath: Partial<SVGMPathElement>;
    path: PathSVGAttributes<SVGPathElement>;
    pattern: PatternSVGAttributes<SVGPatternElement>;
    polygon: PolygonSVGAttributes<SVGPolygonElement>;
    polyline: PolylineSVGAttributes<SVGPolylineElement>;
    radialGradient: RadialGradientSVGAttributes<SVGRadialGradientElement>;
    rect: RectSVGAttributes<SVGRectElement>;
    set: Partial<SVGSetElement>;
    stop: StopSVGAttributes<SVGStopElement>;
    svg: SvgSVGAttributes<SVGSVGElement>;
    switch: SwitchSVGAttributes<SVGSwitchElement>;
    symbol: SymbolSVGAttributes<SVGSymbolElement>;
    text: TextSVGAttributes<SVGTextElement>;
    textPath: TextPathSVGAttributes<SVGTextPathElement>;
    tspan: TSpanSVGAttributes<SVGTSpanElement>;
    use: UseSVGAttributes<SVGUseElement>;
    view: ViewSVGAttributes<SVGViewElement>;
  }
  interface IntrinsicElements extends
    HTMLElementTags,
    HTMLElementDeprecatedTags,
    SVGElementTags,
    StellisElements {

  }
}
