from django import template
register = template.Library()

# @register.simple_tag
# def define(val=None):
#   return val

@register.simple_tag
def add_value(*args):
    return sum(args)

@register.filter
def set_variable(value, arg):
    return arg

@register.simple_tag
def setvar(val=None):
  return val

@register.simple_tag
def update_variable(value):
    return value

@register.simple_tag(takes_context=True)
def var_exists(context, name):
    dicts = context.dicts  # array of dicts
    if dicts:
        for d in dicts:
            if name in d:
                return True
    return False
