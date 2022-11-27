let t_imports = (ctors: Array<[string, string]>) => `import { View, _ctor } from './views'
import {
${ctors.map(([ctor, $args]) => `${ctor} as ${ctor}_$`).join(',\n')}
} from './views'`

let t_ctors = (ctors: Array<[string, string]>) => 
ctors.map(([ctor, $args]) => `let _${ctor} = (${$args}) => _ctor(${ctor}_$, ${$args})`).join('\n')


let t_views = (views: Array<View>) =>
views.map(view => `let ${view.head} = (${view.$args}) => {
  let parent = _${view.head}(${view.$args})
${t_children(view.children)}
  children.forEach(_ => _.parent = parent)
  parent.children = children

  return parent
}`).join('\n')

let t_child_head = (_: Head) => `let _${_.head}(${_.$args})`
let t_child_content = (_: Content) => _
let t_child_ref = (_: Ref) => `${_._ci}`
let t_child_for = (_: For) => `${_.items}`

let t_child_head_pre_def = (_: Head) => undefined
let t_child_content_pre_def = (_: Content) => undefined
let t_child_ref_pre_def = (_: Ref) => `  let ${_._ci} = ${_.value}
  parent.${_.prop} = ${_._ci}`
let t_child_for_pre_def = (_: For) => `  let ${_.items} = []
  for (let i = 0; i < ${_.items}.length - 1; i++) {
    let i0 = ${_.items}[i]
    let i1 = ${_.items}[i + 1]
    children.push(${_.head0}(i0))
    children.push(${_.head1}(i1))
  }`




let t_children = (children: Array<Child>) => {

  let pre_defs = children.map(child => {
    let res
    if (isHead(child)) {
      res = t_child_head_pre_def(child)
    } else if (isContent(child)) {
      res = t_child_content_pre_def(child)
    } else if (isRef(child)) {
      res = t_child_ref_pre_def(child)
    } else {
      res = t_child_for_pre_def(child)
    }
    if (!res) {
      return ''
    }
    return '  ' + res
  }).join('\n')

  let in_array = children.map(child => {
    let res = ''
    if (isHead(child)) {
      res = t_child_head(child)
    } else if (isContent(child)) {
      res = t_child_content(child)
    } else if (isRef(child)) {
      res = t_child_ref(child)
    } else {
      res = t_child_for(child)
    }
    return '  ' + res
  }).join(',\n')

  return `
${pre_defs}

  let children = [
${in_array}
  ]
`
}

const isHead = (_: Child): _ is Head => {
  return (_ as Head).head !== undefined
}
const isContent = (_: Child): _ is Content => {
  return _ === 'content'
}
const isRef = (_: Child): _ is Ref => {
  return (_ as Ref).prop !== undefined
}
const isFor = (_: Child): _ is For => {
  return (_ as For).items !== undefined
}


type View = {
  head: string,
  $args: string,
  children: Array<Child>,
  ctors: Array<string>
}

type Head = {
  head: string,
  $args: string
}
type Content = 'content'
type Ref = {
  prop: string,
  value: Head,
  _ci: number
}

type For = {
  items: string,
  head0: string,
  head1: string
}

type Child = Head | Content | Ref | For





const get_only_args = (rest: Array<string>) => {
  return rest.flatMap(_ => _.match(/`\${(\w*)}`/g)?? [])
}

const transform_arg = (arg: string) => {
  let match = arg.match(/`\${(\w*)}`/)

  if (match) {
    return match[1]
  }

  match = arg.match(/`\${\.(\w*)}`/)

  if (match) {
    return match[1]
  }
  return 'throw `unknown arg`'
}
const depth_of = (_: string) => _.match(/[^\s]/)?.index

function get_children(depth: number, rest: Array<string>): [Array<string>, Array<string>] | undefined {

  if (rest.length === 0) {
    return undefined
  }
  let depths = rest.map(_ => depth_of(_))
  let ic = depths.findIndex(_ => _ && _ <= depth)

  if (ic === -1) {
    return [rest, []]
  }

  if (ic === 0) {
    return undefined
  }

  return [rest.slice(0, ic), rest.slice(ic)]
}

function get_view(def: string) {
  let [head, ...rest] = def.split('\n')

  let $args = get_only_args(rest).map(transform_arg).join(', ')
  let children = get_children(0, rest)

  let ctors = []

  return {
    head,
    $args,
    children: [],
    ctors
  }
}

export function compileFileToJs(src: string) {

  let _ = src.split('\n\n')

  let views = _.map(get_view)
  let ctors = views.map(_ => [_.head, _.$args])

  return [t_imports(ctors), 
    t_ctors(ctors),
    t_views(views)].join('\n')

}
